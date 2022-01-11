// ==UserScript==
// @name         MusicBrainz: Parse copyright notice
// @version      2022.1.11
// @namespace    https://github.com/kellnerd/musicbrainz-bookmarklets
// @author       kellnerd
// @description  Parses copyright notices and assists the user to create release-label relationships for these.
// @homepageURL  https://github.com/kellnerd/musicbrainz-bookmarklets#parse-copyright-notice
// @downloadURL  https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/parseCopyrightNotice.user.js
// @updateURL    https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/parseCopyrightNotice.user.js
// @supportURL   https://github.com/kellnerd/musicbrainz-bookmarklets/issues
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-idle
// @match        *://*.musicbrainz.org/release/*/edit-relationships
// ==/UserScript==

(function () {
	'use strict';

	/**
	 * @template Params
	 * @template Result
	 */
	class FunctionCache {
		/**
		 * @param {(...params: Params) => Result | Promise<Result>} expensiveFunction Expensive function whose results should be cached.
		 * @param {Object} options
		 * @param {(...params: Params) => string[]} options.keyMapper Maps the function parameters to the components of the cache's key.
		 * @param {string} [options.name] Name of the cache, used as storage key (optional).
		 * @param {Storage} [options.storage] Storage which should be used to persist the cache (optional).
		 * @param {Record<string, Result>} [options.data] Record which should be used as cache (defaults to an empty record).
		 */
		constructor(expensiveFunction, options) {
			this.expensiveFunction = expensiveFunction;
			this.keyMapper = options.keyMapper;
			this.name = options.name ?? `defaultCache`;
			this.storage = options.storage;
			this.data = options.data ?? {};
		}

		/**
		 * Looks up the result for the given parameters and returns it.
		 * If the result is not cached, it will be calculated and added to the cache.
		 * @param {Params} params 
		 */
		async get(...params) {
			const keys = this.keyMapper(...params);
			const lastKey = keys.pop();
			if (!lastKey) return;

			const record = this._get(keys);
			if (record[lastKey] === undefined) {
				// create a new entry to cache the result of the expensive function
				const newEntry = await this.expensiveFunction(...params);
				if (newEntry !== undefined) {
					record[lastKey] = newEntry;
				}
			}

			return record[lastKey];
		}

		/**
		 * Manually sets the cache value for the given key.
		 * @param {string[]} keys Components of the key.
		 * @param {Result} value 
		 */
		set(keys, value) {
			const lastKey = keys.pop();
			this._get(keys)[lastKey] = value;
		}

		/**
		 * Loads the persisted cache entries.
		 */
		load() {
			const storedData = this.storage?.getItem(this.name);
			if (storedData) {
				this.data = JSON.parse(storedData);
			}
		}

		/**
		 * Persists all entries of the cache.
		 */
		store() {
			this.storage?.setItem(this.name, JSON.stringify(this.data));
		}

		/**
		 * Clears all entries of the cache and persists the changes.
		 */
		clear() {
			this.data = {};
			this.store();
		}

		/**
		 * Returns the cache record which is indexed by the key.
		 * @param {string[]} keys Components of the key
		 */
		_get(keys) {
			let record = this.data;
			keys.forEach((key) => {
				if (record[key] === undefined) {
					// create an empty record for all missing keys
					record[key] = {};
				}
				record = record[key];
			});
			return record;
		}
	}

	/**
	 * Fetches the entity with the given MBID from the internal API ws/js.
	 * @param {MB.MBID} gid MBID of the entity.
	 * @returns {Promise<MB.RE.TargetEntity>}
	 */
	async function fetchEntity(gid) {
		const result = await fetch(`/ws/js/entity/${gid}`);
		return MB.entity(await result.json()); // automatically caches entities
	}

	/**
	 * Searches for entities of the given type.
	 * @param {MB.EntityType} entityType 
	 * @param {string} query 
	 * @returns {Promise<MB.InternalEntity[]>}
	 */
	async function searchEntity(entityType, query) {
		const result = await fetch(`/ws/js/${entityType}?q=${encodeURIComponent(query)}`);
		return result.json();
	}

	/**
	 * Temporary cache for fetched entities from the ws/js API, shared with MBS.
	 */
	const entityCache = new FunctionCache(fetchEntity, {
		keyMapper: (gid) => [gid],
		data: MB.entityCache,
	});

	/**
	 * Dummy function to make the cache fail without actually running an expensive function.
	 * @param {MB.EntityType} entityType
	 * @param {string} name
	 * @returns {string}
	 */
	function _nameToMBID(entityType, name) {
		return undefined;
	}

	const nameToMBIDCache = new FunctionCache(_nameToMBID, {
		keyMapper: (entityType, name) => [entityType, name],
		name: 'nameToMBIDCache',
		storage: window.localStorage
	});

	/** MBS relationship link type IDs (incomplete). */
	const LINK_TYPES = {
		release: {
			label: {
				'©': 708,
				'℗': 711,
				'licensed from': 712,
				'licensed to': 833,
				'distributed by': 361,
				'marketed by': 848,
			},
		},
		recording: {
			label: {
				'℗': 867,
			},
		},
	};

	/**
	 * Creates a dialog to add a relationship to the currently edited source entity.
	 * @param {MB.RE.Target<MB.RE.MinimalEntity>} targetEntity Target entity of the relationship.
	 * @returns {MB.RE.Dialog} Pre-filled relationship dialog.
	 */
	function createAddRelationshipDialog(targetEntity) {
		const viewModel = MB.sourceRelationshipEditor
			// releases have multiple relationship editors, edit the release itself
			?? MB.releaseRelationshipEditor;
		return new MB.relationshipEditor.UI.AddDialog({
			viewModel,
			source: viewModel.source,
			target: targetEntity,
		});
	}

	/**
	 * Creates a dialog to batch-add relationships to the given source entities of the currently edited release.
	 * @param {MB.RE.Target<MB.RE.MinimalEntity>} targetEntity Target entity of the relationship.
	 * @param {MB.RE.TargetEntity[]} sourceEntities Entities to which the relationships should be added.
	 * @returns {MB.RE.Dialog} Pre-filled relationship dialog.
	 */
	function createBatchAddRelationshipsDialog(targetEntity, sourceEntities) {
		const viewModel = MB.releaseRelationshipEditor;
		return new MB.relationshipEditor.UI.BatchRelationshipDialog({
			viewModel,
			sources: sourceEntities,
			target: targetEntity,
		});
	}

	/**
	 * Resolves after the given dialog has been closed.
	 * @param {MB.RE.Dialog} dialog
	 */
	function closingDialog(dialog) {
		return new Promise((resolve) => {
			if (dialog) {
				// wait until the jQuery UI dialog has been closed
				dialog.$dialog.on('dialogclose', () => {
					resolve();
				});
			} else {
				resolve();
			}
		});
	}

	/**
	 * Opens the given dialog, focuses the autocomplete input and triggers the search.
	 * @param {MB.RE.Dialog} dialog 
	 * @param {Event} [event] Affects the position of the opened dialog (optional).
	 */
	function openDialogAndTriggerAutocomplete(dialog, event) {
		dialog.open(event);
		dialog.autocomplete.$input.focus();
		dialog.autocomplete.search();
	}

	/**
	 * Returns the target entity of the given relationship dialog.
	 * @param {MB.RE.Dialog} dialog 
	 */
	function getTargetEntity(dialog) {
		return dialog.relationship().entities() // source and target entity
			.find((entity) => entity.entityType === dialog.targetType());
	}

	/**
	 * Creates and fills an "Add relationship" dialog for each piece of copyright information.
	 * Lets the user choose the appropriate target label and waits for the dialog to close before continuing with the next one.
	 * Automatically chooses the first search result and accepts the dialog in automatic mode.
	 * @param {CopyrightItem[]} copyrightInfo List of copyright items.
	 * @param {boolean} [automaticMode] Automatic mode, disabled by default.
	 * @returns Whether a relationships has been added successfully.
	 */
	async function addCopyrightRelationships(copyrightInfo, automaticMode = false) {
		const selectedRecordings = MB.relationshipEditor.UI.checkedRecordings();
		let addedRelCount = 0;

		for (const copyrightItem of copyrightInfo) {
			const entityType = 'label';
			const releaseRelTypes = LINK_TYPES.release[entityType];
			const recordingRelTypes = LINK_TYPES.recording[entityType];

			/**
			 * There are multiple ways to fill the relationship's target entity:
			 * (1) Directly map the name to an MBID (if the name is already cached).
			 * (2) Select the first search result for the name (in automatic mode).
			 * (3) Just fill in the name and let the user select an entity (in manual mode).
			 */
			const targetMBID = await nameToMBIDCache.get(entityType, copyrightItem.name); // (1a)
			let targetEntity = targetMBID
				? await entityCache.get(targetMBID) // (1b)
				: MB.entity(automaticMode
					? (await searchEntity(entityType, copyrightItem.name))[0] // (2a)
					: { name: copyrightItem.name, entityType } // (3a)
				);

			for (const type of copyrightItem.types) {
				// add all copyright rels to the release
				const dialog = createAddRelationshipDialog(targetEntity);
				targetEntity = await fillAndProcessDialog(dialog, copyrightItem, releaseRelTypes[type], targetEntity);

				// also add phonographic copyright rels to all selected recordings
				if (type === '℗' && selectedRecordings.length) {
					const recordingsDialog = createBatchAddRelationshipsDialog(targetEntity, selectedRecordings);
					targetEntity = await fillAndProcessDialog(recordingsDialog, copyrightItem, recordingRelTypes[type], targetEntity);
				}
			}
		}

		return !!addedRelCount;

		/**
		 * @param {MB.RE.Dialog} dialog 
		 * @param {CopyrightItem} copyrightItem 
		 * @param {number} relTypeId 
		 * @param {MB.RE.Target<MB.RE.MinimalEntity>} targetEntity 
		 * @returns {Promise<MB.RE.TargetEntity>}
		 */
		async function fillAndProcessDialog(dialog, copyrightItem, relTypeId, targetEntity) {
			const rel = dialog.relationship();
			rel.linkTypeID(relTypeId);
			rel.entity0_credit(copyrightItem.name);
			if (copyrightItem.year) {
				rel.begin_date.year(copyrightItem.year);
				rel.end_date.year(copyrightItem.year);
			}

			if (targetEntity.gid || automaticMode) { // (1c) & (2b)
				dialog.accept();
				addedRelCount++;
			} else { // (3b)
				openDialogAndTriggerAutocomplete(dialog);
				await closingDialog(dialog);

				// remember the entity which the user has chosen for the given name
				targetEntity = getTargetEntity(dialog);
				if (targetEntity.gid) {
					nameToMBIDCache.set([targetEntity.entityType, copyrightItem.name], targetEntity.gid);
					addedRelCount++;
				}
			}
			return targetEntity;
		}
	}

	/**
	 * @typedef {import('./parseCopyrightNotice.js').CopyrightItem} CopyrightItem
	 */

	/**
	 * Creates a DOM element from the given HTML fragment.
	 * @param {string} html HTML fragment.
	 */
	function createElement(html) {
		const template = document.createElement('template');
		template.innerHTML = html;
		return template.content.firstElementChild;
	}

	/**
	 * Creates a style element from the given CSS fragment and injects it into the document's head.
	 * @param {string} css CSS fragment.
	 * @param {string} userscriptName Name of the userscript, used to generate an ID for the style element.
	 */
	function injectStylesheet(css, userscriptName) {
		const style = document.createElement('style');
		if (userscriptName) {
			style.id = [userscriptName, 'userscript-css'].join('-');
		}
		style.innerText = css;
		document.head.append(style);
	}

	/**
	 * Returns a reference to the first DOM element with the specified value of the ID attribute.
	 * @param {string} elementId String that specifies the ID value.
	 */
	function dom(elementId) {
		return document.getElementById(elementId);
	}

	/**
	 * Returns the first element that is a descendant of node that matches selectors.
	 * @param {string} selectors 
	 * @param {ParentNode} node 
	 */
	function qs(selectors, node = document) {
		return node.querySelector(selectors);
	}

	/**
	 * Adds the given message and a footer for the active userscript to the edit note.
	 * @param {string} message Edit note message.
	 */
	function addMessageToEditNote(message) {
		/** @type {HTMLTextAreaElement} */
		const editNoteInput = document.querySelector('#edit-note-text, .edit-note');
		const previousContent = editNoteInput.value.split(separator);
		editNoteInput.value = buildEditNote(...previousContent, message);
		editNoteInput.dispatchEvent(new Event('change'));
	}

	/**
	 * Builds an edit note for the given message sections and adds a footer section for the active userscript.
	 * Automatically de-duplicates the sections to reduce auto-generated message and footer spam.
	 * @param {...string} sections Edit note sections.
	 * @returns {string} Complete edit note content.
	 */
	function buildEditNote(...sections) {
		sections = sections.map((section) => section.trim());

		if (typeof GM_info !== 'undefined') {
			sections.push(`${GM_info.script.name} (v${GM_info.script.version}, ${GM_info.script.namespace})`);
		}

		// drop empty sections and keep only the last occurrence of duplicate sections
		return sections
			.filter((section, index) => section && sections.lastIndexOf(section) === index)
			.join(separator);
	}

	const separator = '\n—\n';

	/**
	 * Persists the desired attribute of the given element across page loads and origins.
	 * @param {HTMLElement} element 
	 * @param {keyof HTMLElement} attribute 
	 * @param {keyof HTMLElementEventMap} eventType
	 */
	async function persistElement(element, attribute, eventType) {
		if (!element.id) {
			throw new Error('Can not persist an element without ID');
		}

		const key = ['persist', element.id, attribute].join('.');

		// initialize attribute
		const persistedValue = await GM.getValue(key);
		if (persistedValue) {
			element[attribute] = persistedValue;
		}

		// persist attribute once the event occurs
		element.addEventListener(eventType, () => {
			GM.setValue(key, element[attribute]);
		});
	}

	/**
	 * Persists the state of the checkbox with the given ID across page loads and origins.
	 * @param {string} id 
	 */
	function persistCheckbox(id) {
		return persistElement(dom(id), 'checked', 'change');
	}

	/**
	 * Persists the state of the collapsible details container with the given ID across page loads and origins.
	 * @param {string} id 
	 */
	function persistDetails(id) {
		return persistElement(dom(id), 'open', 'toggle');
	}

	const creditParserUI =
`<details id="credit-parser">
<summary>
	<h2>Credit Parser</h2>
</summary>
<form>
	<div class="row">
		<textarea name="credit-input" id="credit-input" cols="120" rows="1" placeholder="Paste credits here…"></textarea>
	</div>
	<div class="row">
		<p>Identified relationships will be added to the release and/or the matching recordings and works (only if these are selected).</p>
	</div>
	<div class="row">
		<input type="checkbox" name="remove-parsed-lines" id="remove-parsed-lines" />
		<label class="inline" for="remove-parsed-lines">Remove parsed lines</label>
	</div>
	<div class="row buttons">
	</div>
</form>
</details>`	;

	const css =
`details#credit-parser > summary {
	cursor: pointer;
	display: block;
}
details#credit-parser > summary > h2 {
	display: list-item;
}
textarea#credit-input {
	overflow-y: hidden;
}`	;

	function buildCreditParserUI() {
		// possibly called by multiple userscripts, do not inject the UI again
		if (dom('credit-parser')) return;

		// inject credit parser between the sections for track and release relationships,
		// use the "Release Relationships" heading as orientation since #tracklist is missing for releases without mediums
		qs('#content > h2:nth-of-type(2)').insertAdjacentHTML('beforebegin', creditParserUI);
		injectStylesheet(css, 'credit-parser');

		// persist the state of the UI
		persistDetails('credit-parser');
		persistCheckbox('remove-parsed-lines');

		// auto-resize the credit textarea on input (https://stackoverflow.com/a/25621277)
		dom('credit-input').addEventListener('input', function () {
			this.style.height = 'auto';
			this.style.height = this.scrollHeight + 'px';
		});

		addButton('Load annotation', (creditInput) => {
			const annotation = MB.releaseRelationshipEditor.source.latest_annotation;
			if (annotation) {
				creditInput.value = annotation.text;
				creditInput.dispatchEvent(new Event('input'));
			}
		});
	}

	/**
	 * Adds a new button with the given label and click handler to the credit parser UI.
	 * @param {string} label 
	 * @param {(creditInput: HTMLTextAreaElement, event: MouseEvent) => any} clickHandler 
	 * @param {string} [description] Description of the button, shown as tooltip.
	 */
	function addButton(label, clickHandler, description) {
		/** @type {HTMLTextAreaElement} */
		const creditInput = dom('credit-input');

		/** @type {HTMLButtonElement} */
		const button = createElement(`<button type="button">${label}</button>`);
		if (description) {
			button.title = description;
		}

		button.addEventListener('click', (event) => clickHandler(creditInput, event));

		return qs('#credit-parser .buttons').appendChild(button);
	}

	/**
	 * Adds a new parser button with the given label and handler to the credit parser UI.
	 * @param {string} label 
	 * @param {(creditLine: string, event: MouseEvent) => Promise<boolean> | boolean} parser
	 * Handler which parses the given credit line and returns whether it was successful.
	 * @param {string} [description] Description of the button, shown as tooltip.
	 */
	function addParserButton(label, parser, description) {
		/** @type {HTMLInputElement} */
		const removeParsedLines = dom('remove-parsed-lines');

		return addButton(label, async (creditInput, event) => {
			const credits = creditInput.value.split('\n').map((line) => line.trim());
			const parsedLines = [], skippedLines = [];

			for (const line of credits) {
				// skip empty lines, but keep them for display of skipped lines
				if (!line) {
					skippedLines.push(line);
					continue;
				}

				const parserSucceeded = await parser(line, event);
				if (parserSucceeded) {
					parsedLines.push(line);
				} else {
					skippedLines.push(line);
				}
			}

			if (parsedLines.length) {
				addMessageToEditNote(parsedLines.join('\n'));
			}

			if (removeParsedLines.checked) {
				creditInput.value = skippedLines.join('\n');
				creditInput.dispatchEvent(new Event('input'));
			}
		}, description);
	}

	/**
	 * Transforms the given value using the given substitution rules.
	 * @param {string} value 
	 * @param {(string|RegExp)[][]} substitutionRules Pairs of values for search & replace.
	 * @returns {string}
	 */
	function transform(value, substitutionRules) {
		substitutionRules.forEach(([searchValue, replaceValue]) => {
			value = value.replace(searchValue, replaceValue);
		});
		return value;
	}

	const labelNamePattern = /(.+?(?:,? (?:LLC|LLP|(?:Inc|Ltd)\.?))?)(?:(?<=\.)|$|(?=,|\.| under ))/;

	const copyrightPattern = new RegExp(
		/([©℗](?:\s*[&+]?\s*[©℗])?)(?:.+?;)?\s*(\d{4})?\s+/.source + labelNamePattern.source, 'gm');

	const legalInfoPattern = new RegExp(
		/(licen[sc]ed? (?:to|from)|(?:distributed|marketed) by)\s+/.source + labelNamePattern.source, 'gim');

	/**
	 * Extracts all copyright and legal information from the given text.
	 * @param {string} text 
	 */
	function parseCopyrightNotice(text) {
		/** @type {CopyrightItem[]} */
		const copyrightInfo = [];

		// standardize copyright notice
		text = transform(text, [
			[/\(C\)/gi, '©'],
			[/\(P\)/gi, '℗'],
			[/«(.+?)»/g, '$1'], // remove a-tisket's French quotes
			[/for (.+?) and (.+?) for the world outside \1/g, '/ $2'], // simplify region-specific copyrights
			[/℗\s*(under )/gi, '$1'], // drop confusingly used ℗ symbols
		]);

		const copyrightMatches = text.matchAll(copyrightPattern);
		for (const match of copyrightMatches) {
			const names = match[3].split(/\/(?=\s|\w{2})/g).map((name) => name.trim());
			const types = match[1].split(/[&+]|(?<=[©℗])(?=[©℗])/).map(cleanType);
			names.forEach((name) => {
				copyrightInfo.push({
					name,
					types,
					year: match[2],
				});
			});
		}

		const legalInfoMatches = text.matchAll(legalInfoPattern);
		for (const match of legalInfoMatches) {
			copyrightInfo.push({
				name: match[2],
				types: [cleanType(match[1])],
			});
		}

		return copyrightInfo;
	}

	/**
	 * Cleans and standardizes the given free text copyright/legal type.
	 * @param {string} type 
	 */
	function cleanType(type) {
		return transform(type.toLowerCase().trim(), [
			[/licen[sc]ed?/g, 'licensed'],
		]);
	}

	/**
	 * @typedef {Object} CopyrightItem
	 * @property {string} name Name of the copyright owner (label or artist).
	 * @property {string[]} types Types of copyright or legal information, will be mapped to relationship types.
	 * @property {string} [year] Numeric year, has to be a string with four digits, otherwise MBS complains.
	 */

	function buildUI() {
		buildCreditParserUI();
		addParserButton('Parse copyright notice', async (creditLine, event) => {
			const copyrightInfo = parseCopyrightNotice(creditLine);
			if (copyrightInfo.length) {
				const automaticMode = event.altKey;
				const result = await addCopyrightRelationships(copyrightInfo, automaticMode);
				nameToMBIDCache.store();
				return result;
			} else {
				return false;
			}
		});
	}

	nameToMBIDCache.load();
	buildUI();

})();
