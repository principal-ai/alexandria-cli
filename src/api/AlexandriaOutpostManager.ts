/**
 * Re-export AlexandriaOutpostManager from @principal-ai/alexandria-core-library
 *
 * The Alexandria team has moved the outpost manager implementation
 * to the core library package for better code reuse.
 */

export {
  AlexandriaOutpostManager,
  NodeFileSystemAdapter,
  NodeGlobAdapter,
} from '@principal-ai/alexandria-core-library';
export type { AlexandriaRepository } from '@principal-ai/alexandria-core-library';
