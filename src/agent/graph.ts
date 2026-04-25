import { SystemMessage, type BaseMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph } from '@langchain/langgraph';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
    loadWorkflowOpencode,
    parseWorkflowOpencode,
    readScaffoldAsset,
    type WorkflowOpencode,
} from '../scaffold/index.js';
import { MAW_SYSTEM_ID, StateAnnotation } from './state.js';

const DEFAULT_GRAPH_NAME = 'New Agent';
const DEFAULT_MODEL = 'gpt-4.1-mini';
const EMPTY_HANDOFF = 'Planner returned an empty handoff.';
const DEFAULT_OPENCODE = parseWorkflowOpencode(JSON.parse(readScaffoldAsset('opencode')));

type RuntimeAgent = 'planner' | 'coder';

export interface GraphConfig {
    name?: string;
    opencode?: WorkflowOpencode;
    root?: string;
    workflow?: string;
}

interface Runtime {
    opencode: WorkflowOpencode;
}

interface Model {
    invoke(input: BaseMessage[], config?: RunnableConfig): Promise<BaseMessage>;
}

const fileExists = async (file: string): Promise<boolean> => {
    try {
        await access(file);
        return true;
    } catch {
        return false;
    }
};

const message = (err: unknown): string =>
    err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' ? err.message : String(err);

const createModel = (): Model => {
    return new ChatOpenAI({ model: DEFAULT_MODEL });
};

const loadRuntime = async (cfg: GraphConfig): Promise<Runtime> => {
    if (cfg.opencode) {
        return {
            opencode: parseWorkflowOpencode(cfg.opencode),
        };
    }

    if (!cfg.workflow) {
        return {
            opencode: DEFAULT_OPENCODE,
        };
    }

    const root = cfg.root ?? process.cwd();
    const file = resolve(root, '.maw/graphs', cfg.workflow, 'opencode.json');

    if (!(await fileExists(file))) {
        return {
            opencode: DEFAULT_OPENCODE,
        };
    }

    try {
        return {
            opencode: await loadWorkflowOpencode(file),
        };
    } catch (err) {
        throw new Error(`Invalid opencode.json at ${file}: ${message(err)}`);
    }
};

const prompt = (runtime: Runtime, name: RuntimeAgent, handoff = ''): string => {
    const text = runtime.opencode.agent[name].prompt.trim();

    if (name !== 'coder') {
        return text;
    }

    return `${text}\n\nPlanner handoff:\n${handoff.trim() || EMPTY_HANDOFF}`;
};

const withSystem = (text: string, messages: BaseMessage[]): BaseMessage[] => {
    return [
        new SystemMessage({
            content: text,
            id: MAW_SYSTEM_ID,
        }),
        ...messages,
    ];
};

const contentPart = (value: unknown): string => {
    if (typeof value === 'string') {
        return value;
    }

    if (!value || typeof value !== 'object' || !('text' in value) || typeof value.text !== 'string') {
        return '';
    }

    return value.text;
};

const contentText = (value: unknown): string => {
    if (typeof value === 'string') {
        return value;
    }

    if (!Array.isArray(value)) {
        return '';
    }

    return value
        .map(contentPart)
        .filter((part) => part.length > 0)
        .join('\n')
        .trim();
};

const handoffText = (message: BaseMessage): string => {
    const handoff = contentText(message.content).trim();

    if (handoff.length > 0) {
        return handoff;
    }

    return EMPTY_HANDOFF;
};

const plannerNode = (runtime: Promise<Runtime>, model: Model) => {
    return async (
        state: typeof StateAnnotation.State,
        config: RunnableConfig,
    ): Promise<typeof StateAnnotation.Update> => {
        const cfg = await runtime;
        const plannerPrompt = prompt(cfg, 'planner');
        const reply = await model.invoke(withSystem(plannerPrompt, state.messages), config);

        return {
            plannerPrompt,
            handoff: handoffText(reply),
            messages: [reply],
        };
    };
};

const coderNode = (runtime: Promise<Runtime>, model: Model) => {
    return async (
        state: typeof StateAnnotation.State,
        config: RunnableConfig,
    ): Promise<typeof StateAnnotation.Update> => {
        const cfg = await runtime;
        const coderPrompt = prompt(cfg, 'coder', state.handoff);
        const reply = await model.invoke(withSystem(coderPrompt, state.messages), config);

        return {
            coderPrompt,
            messages: [reply],
        };
    };
};

export const route = (state: typeof StateAnnotation.State): '__end__' | 'callModel' => {
    if (state.messages.length > 0) {
        return '__end__';
    }

    return 'callModel';
};

export const createGraph = (cfg: GraphConfig = {}) => {
    const runtime = loadRuntime(cfg);
    const model = createModel();
    const graph = new StateGraph(StateAnnotation)
        .addNode('planner', plannerNode(runtime, model))
        .addNode('coder', coderNode(runtime, model))
        .addEdge('__start__', 'planner')
        .addEdge('planner', 'coder')
        .addEdge('coder', '__end__')
        .compile();

    graph.name = cfg.name ?? cfg.workflow ?? DEFAULT_GRAPH_NAME;

    return graph;
};

export const graph = createGraph();
