/**
 * This package can be used by external projects to create their own MusicBrainz scripts.
 * It re-exports potentially useful pieces of code from `src/` which are considered to be mostly stable (as a shortcut).
 * 
 * - Shortcut usage: `import { buildEditNote } from 'musicbrainz-scripts';`
 * - Full specifier: `import { buildEditNote } from 'musicbrainz-scripts/src/editNote.js';`
 * 
 * You can also import utility functions from `utils/` and build tools from `build/` if you want to:
 * - Utility function: `import { guessUnicodePunctuation } from 'musicbrainz-scripts/utils/string/punctuation.js';`
 * - Build tool: `import { buildBookmarklet } from 'musicbrainz-scripts/tools/buildBookmarklets.js'`
 */

export {
	addMessageToEditNote,
	buildEditNote,
} from './src/editNote.js';

export {
	entityCache,
} from './src/entityCache.js';

export {
	guessUnicodePunctuation,
} from './src/guessUnicodePunctuation.js';

export {
	createMBIDInput,
} from './src/inputMBID.js';

export {
	searchEntity,
} from './src/internalAPI.js';

export {
	nameToMBIDCache,
} from './src/nameToMBIDCache.js';

export {
	fetchFromAPI,
	getEntityForResourceURL,
} from './src/publicAPI.js';

export {
	onReactHydrated,
	readyRelationshipEditor,
} from './src/reactHydration.js';

export {
	createReleaseSeederForm,
	seedURLForEntity,
} from './src/seeding.js';

export {
	createDialog as createRelationshipDialog,
	createBatchDialog as createRelationshipBatchDialog,
	closingDialog as closingRelationshipDialog,
} from './src/relationship-editor/createDialog.js';

export {
	createRelationship,
	batchCreateRelationships,
	createAttributeTree as createRelationshipAttributeTree,
} from './src/relationship-editor/createRelationship.js';
