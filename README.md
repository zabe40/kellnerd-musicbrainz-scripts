# musicbrainz-scripts

**[Bookmarklets](https://en.wikipedia.org/wiki/Bookmarklet) and [Userscripts](https://en.wikipedia.org/wiki/Userscript) for [MusicBrainz.org](https://musicbrainz.org)**

In order to use one of the **bookmarklets** you have to save the compressed code snippet from the respective section below as a bookmark. Make sure to add the bookmark to a toolbar of your browser which you can easily access while you are editing on MusicBrainz.

While bookmarklets are good for trying things out because they do not require additional software to be installed, **userscripts** are more convenient if you need a snippet frequently. In case you have installed a userscript manager browser extension you can simply install userscripts from this page by clicking the *Install* button. Another benefit of them is that you will receive automatic updates if your userscript manager is configured accordingly.

## Userscripts

### Guess Unicode Punctuation

Searches and replaces ASCII punctuation symbols for many input fields by their preferred Unicode counterparts. Provides “Guess punctuation” buttons for titles, names, disambiguation comments, annotations and edit notes on all entity edit and creation pages.
- Guesses Unicode punctuation based on context as the ASCII symbols are ambiguous.
- Highlights all updated input fields in order to allow the user to review the changes.
- Works for release/medium/track titles and release disambiguation comments (in the release editor).
- Also supports other entity names and disambiguation comments (on their respective edit and creation pages).
- Detects the selected language (in the release editor) and uses localized quotes.
- Experimental support for annotations and edit notes. Preserves apostrophe-based markup (bold, italic) and URLs.

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/guessUnicodePunctuation.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/guessUnicodePunctuation.user.js)

Also available as a bookmarklet with less features:

Supports the same fields as the userscript but without language detection and granular control over the affected fields.

```js
javascript:(()=>{function e(e,t){const a="background-color";$(e).css(a,"").each((e,n)=>{let g=n.value;g&&(g=((e,t)=>(t.forEach(([t,a])=>{e=e.replace(t,a)}),e))(g,t),g!=n.value&&$(n).val(g).trigger("change").css(a,"yellow"))})}const t=[[/(?<=[^\p{L}\d]|^)"(.+?)"(?=[^\p{L}\d]|$)/gu,"\u201c$1\u201d"],[/(?<=\W|^)'(n)'(?=\W|$)/gi,"\u2019$1\u2019"],[/(?<=[^\p{L}\d]|^)'(.+?)'(?=[^\p{L}\d]|$)/gu,"\u2018$1\u2019"],[/(\d+)"/g,"$1\u2033"],[/(\d+)'(\d+)/g,"$1\u2032$2"],[/'/g,"\u2019"],[/(?<!\.)\.{3}(?!\.)/g,"\u2026"],[/ - /g," \u2013 "],[/\d{4}-\d{2}(?:-\d{2})?(?=\W|$)/g,e=>Number.isNaN(Date.parse(e))?e:e.replaceAll("-","\u2010")],[/\d+(-\d+){2,}/g,e=>e.replaceAll("-","\u2012")],[/(\d+)-(\d+)/g,"$1\u2013$2"],[/(?<=\S)-(?=\S)/g,"\u2010"]],a=[[/\[(.+?)(\|.+?)?\]/g,(e,t,a="")=>`[${btoa(t)}${a}]`],[/(?<=\/\/)(\S+)/g,(e,t)=>btoa(t)],[/'''/g,"<b>"],[/''/g,"<i>"],...t,[/<b>/g,"'''"],[/<i>/g,"''"],[/(?<=\/\/)([A-Za-z0-9+/=]+)/g,(e,t)=>atob(t)],[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(e,t,a="")=>`[${atob(t)}${a}]`]];e("input#name,input#comment,input.track-name,input[id^=medium-title],input[name$=name],input[name$=comment]",t),e("#annotation,#edit-note-text,textarea[name$=text],.edit-note",a)})();
```

### Import ARD Radio Dramas

Imports German broadcast releases from the ARD radio drama database.

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/importARDRadioDramas.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/importARDRadioDramas.user.js)

### Parse Copyright Notice

Parses copyright notices and automates the process of creating release and recording relationships for these.
- Extracts all copyright and legal information from the given text.
- Automates the process of creating label-release (or artist-release) relationships for these credits.
- Also creates phonographic copyright relationships for all selected recordings.
- Detects artists who own the copyright of their own release and defaults to adding artist-release relationships for these credits.
- See the [wiki page](https://github.com/kellnerd/musicbrainz-scripts/wiki/Parse-Copyright-Notices) for more details.
- Allows seeding of the credit input (`credits`) and the edit note (`edit-note`) via custom query parameters, which are encoded into the hash of the URL (*Example*: `/edit-relationships#credits=(C)+2023+Test&edit-note=Seeding+example`).

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/parseCopyrightNotice.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/parseCopyrightNotice.user.js)

### Voice Actor Credits

Parses voice actor credits from text and automates the process of creating release relationships for these. Also imports credits from Discogs.
- Simplifies the addition of “spoken vocals” relationships (at release level) by providing a pre-filled dialogue in the relationship editor.
- Parses a list of voice actor credits from text and remembers name to MBID mappings.
- Imports voice actor credits from linked Discogs release pages.
- Automatically matches artists whose Discogs pages are linked to MB (unlinked artists can be selected from the already opened inline search).
- Allows seeding of the credit input (`credits`) and the edit note (`edit-note`) via custom query parameters, which are encoded into the hash of the URL (*Example*: `/edit-relationships#credits=Narrator+-+John+Doe&edit-note=Seeding+example`).

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/voiceActorCredits.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/voiceActorCredits.user.js)

Also available as a bookmarklet with less features:

Opens a pre-filled dialogue for a “spoken vocals” artist-release relationship in the release relationship editor.

```js
javascript:void((e={},t="",i="")=>{const r=MB.releaseRelationshipEditor,a=MB.entity(e,"artist"),d=new MB.relationshipEditor.UI.AddDialog({source:r.source,target:a,viewModel:r}),o=d.relationship();return o.linkTypeID(60),o.entity0_credit(i),o.setAttributes([{type:{gid:"d3a36e62-a7c4-4eb9-839f-adfebe87ac12"},credited_as:t}]),d})().open();
```

## Bookmarklets

### [Annotation Converter](src/annotationConverter.js)

- Allows entity annotations to be (partly) written in basic Markdown and converts them into valid annotation markup.
- Shortens absolute URLs to MusicBrainz entities to `[entity-type:mbid|label]` links.
- Automatically fetches and uses the name of the linked entity as label if none was given.
- Also supports collection descriptions and user profile biographies.

```js
javascript:((a,e)=>{const t="background-color";$("textarea[name$=text],textarea[name$=description],textarea[name$=biography]").css(t,"").each((a,n)=>{let r=n.value;r&&(r=((a,e)=>(e.forEach(([e,t])=>{a=a.replace(e,t)}),a))(r,e),r!=n.value&&$(n).val(r).trigger("change").css(t,"yellow"))})})(0,[[/\[(.+?)\]\((.+?)\)/g,"[$2|$1]"],[/(?<!\[)(https?:\/\/\S+)/g,"[$1]"],[/\[(.+?)(\|.+?)?\]/g,(a,e,t="")=>`[${btoa(e)}${t}]`],[/(__|\*\*)(?=\S)(.+?)(?<=\S)\1/g,"'''$2'''"],[/(_|\*)(?=\S)(.+?)(?<=\S)\1/g,"''$2''"],[/^\# +(.+?)( +\#*)?$/gm,"= $1 ="],[/^\#{2} +(.+?)( +\#*)?$/gm,"== $1 =="],[/^\#{3} +(.+?)( +\#*)?$/gm,"=== $1 ==="],[/^(\d+)\. +/gm,"    $1. "],[/^[-+*] +/gm,"    * "],[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(a,e,t="")=>`[${atob(e)}${t}]`]]),void $("textarea[name$=text],textarea[name$=description],textarea[name$=biography]").each(async(a,e)=>{e.disabled=!0;let t=await(n=e.value,(async(a,e,t)=>{const $=[];a.replace(e,(a,...e)=>{const t=((a,e,t)=>(async(a,e)=>{if(a.includes("musicbrainz.org")){const t=new URL(a),[$,n,r]=t.pathname.match(/^\/(.+?)\/([0-9a-f-]{36})$/)||[];if($)return e||(e=await(async a=>{a.pathname="/ws/2"+a.pathname,a.search="?fmt=json";let e=await fetch(a);return e=await e.json(),e.name||e.title})(t)),`[${n}:${r}|${e}]`}return((a,e)=>e?`[${a}|${e}]`:`[${a}]`)(a,e)})(e,t))(a,...e);$.push(t)});const n=await Promise.all($);return a.replace(e,()=>n.shift())})(n,/\[(.+?)(?:\|(.+?))?\]/g));var n;t!=e.value&&$(e).val(t),e.disabled=!1});
```

### [Batch Add Parts Of Series](src/bookmarklets/batchAddPartsOfSeries.js)

- Batch-adds entities as parts of the currently edited series.
- Automatically extracts numbers from titles and uses them as relationship attributes.

```js
javascript:(()=>{async function t(t){const e=await fetch("/ws/js/entity/"+t);return MB.entity(await e.json())}function e(t,e=!1){const a=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor;return new MB.relationshipEditor.UI.AddDialog({viewModel:a,source:a.source,target:t,backward:e})}const a=prompt("MBIDs of entities which should be added as parts of the series:");a&&(async a=>{for(let i of a){const a=await t(i),o=e(a),s=a.name.match(/\d+/);s&&o.relationship().setAttributes([{type:{gid:"a59c5830-5ec7-38fe-9a21-c7ea54f6650a"},text_value:s[0]}]),o.accept()}})(Array.from(a.matchAll(/[0-9a-f-]{36}/gm),t=>t[0]))})();
```

### [Change All Release Dates](src/changeAllReleaseDates.js)

- Changes the date for all release events of a release according to the user's input.
- Useful to correct the dates for digital media releases with lots of release events which are using the wrong first
  release date of the release group.

```js
javascript:(()=>{function e(e,t){$("input.partial-date-"+e).val(t).trigger("change")}const t=prompt("Date for all release events (YYYY-MM-DD):");if(null!==t){const[,a,n,l]=/(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/.exec(t)||[];((t,a,n)=>{e("year",t),e("month",a),e("day",n)})(a,n,l)}})();
```

### [Clear Redundant Medium Titles](src/bookmarklets/clearRedundantMediumTitles.js)

- Clears medium titles if they are redundant and contain only the medium format and position.
- Adds a link to the relevant guideline to the edit note.

```js
javascript:(()=>{function e(e,t,i=new Event("change")){e.value=t,e.dispatchEvent(i)}((e,t=document)=>t.querySelectorAll(e))("input[id^=medium-title]").forEach(t=>e(t,t.value.replace(/^(Cassette|CD|Dis[ck]|DVD|SACD|Vinyl)\s*\d+/i,"").trim()));const t=document.getElementById("edit-note-text");e(t,"Clear redundant medium titles, see https://musicbrainz.org/doc/Style/Release#Medium_title\n"+t.value)})();
```

### [Detect Cover Art Types](src/detectCoverArtTypes.js)

- Detects and fills the image types and comment of all pending uploads using their filenames.
- Treats filename parts in parentheses as image comments.

```js
javascript:(()=>{function t(t,e=document){return e.querySelector(t)}function e(t,e=document){return e.querySelectorAll(t)}const n='ul.cover-art-type-checkboxes input[type="checkbox"]';(({additionalTypes:c=[],commentPattern:o}={})=>{const a=e('tbody[data-bind="foreach: files_to_upload"] > tr'),r={};e(n,a[0]).forEach(t=>{t.parentElement.textContent.trim().toLowerCase().split("/").forEach(e=>r[e]=t.value)});const i=RegExp(String.raw`(?<=\W|_|^)(${Object.keys(r).join("|")})(?=\W|_|$)`,"gi");a.forEach(a=>{const l=t('.file-info span[data-bind="text: name"]',a).textContent,s=Array.from(l.matchAll(i),t=>t[0]);if(c&&s.push(...c),s.length&&((t,c=[])=>{e(n,t).forEach(t=>{c.includes(t.value)&&(t.checked=!0,t.dispatchEvent(new Event("click")))})})(a,s.map(t=>r[t.toLowerCase()])),o){const e=l.match(o);e&&((e,n)=>{const c=t("input.comment",e);c.value=n,c.dispatchEvent(new Event("change"))})(a,e[0])}})})({commentPattern:/(?<=\().+?(?=\))/})})();
```

### [Enumerate Track Titles](src/enumerateTrackTitles.js)

- Renames all tracks using their absolute track number and a customizable prefix (which can be empty).
- Useful to number the parts of an audiobook without chapters and other releases with untitled tracks.
- Asks the user to input a numbering prefix which can optionally be preceded by flags:
  - Append the number (including the given prefix) to the current titles: `+`
  - Pad numbers with leading zeros to the same length: `_`
  - *Example*: `+_, Part ` renames track 27/143 "Title" to "Title, Part 027"

```js
javascript:(()=>{const e=prompt("Numbering prefix, preceded by flags:\n+ append to current titles\n_ pad numbers","Part ");if(null!==e){let[,t,n]=e.match(/^([+_]*)(.*)/);t={append:t.includes("+"),padNumbers:t.includes("_")},((e="",t={})=>{let n=$("input.track-name");const r=n.length.toString().length,a=new Intl.NumberFormat("en",{minimumIntegerDigits:r});n.each((n,r)=>{let l=n+1;t.padNumbers&&(l=a.format(l));let p=e+l;t.append&&(p=(r.value+p).replace(/([.!?]),/,"$1")),$(r).val(p)}).trigger("change")})(n,t)}})();
```

### [Expand Collapsed Mediums](src/expandCollapsedMediums.js)

- Expands all collapsed mediums in the release editor, useful for large releases.

```js
javascript:void $(".expand-medium").trigger("click");
```

### [Guess Series Relationship](src/bookmarklets/guessSeriesRelationship.js)

- Guesses the series name from the name of the currently edited entity and adds a relationship.
- Tries to extract the series number from the entity name to use it as relationship attribute.

```js
javascript:void(async e=>{const t=document.querySelector("h1 bdi").textContent.match(/(.+?)(?: (\d+))?:/);if(!t)return;const o=((e,t=!1)=>{const o=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor;return new MB.relationshipEditor.UI.AddDialog({viewModel:o,source:o.source,target:e,backward:t})})(MB.entity({name:t[1]},"series")),i=t[2];i&&o.relationship().setAttributes([{type:{gid:"a59c5830-5ec7-38fe-9a21-c7ea54f6650a"},text_value:i}]),((e,t)=>{e.open(void 0),e.autocomplete.$input.focus(),e.autocomplete.search()})(o)})();
```

### [Load Release With Magic ISRC](src/bookmarklets/loadReleaseWithMagicISRC.js)

- Opens [kepstin’s MagicISRC](https://magicisrc.kepstin.ca) and loads the currently visited MusicBrainz release.

```js
javascript:(()=>{const a=location.pathname.match(/release\/([0-9a-f-]{36})/)?.[1];(a=>{a&&open("https://magicisrc.kepstin.ca?mbid="+a)})(a)})();
```

### [Mark Release As Worldwide](src/bookmarklets/markReleaseAsWorldwide.js)

- Removes all release events except for the first one and changes its country to [Worldwide].
- Allows to replace an exhaustive list of release countries/events with a single release event.

```js
javascript:$(".remove-release-event:not(:first)").trigger("click"),void $("#country-0").val(240).trigger("change");
```

### [Relate This Entity To Multiple MBID](src/bookmarklets/relateThisEntityToMultipleMBID.js)

- Relates the currently edited entity to multiple entities given by their MBIDs.
- Automatically uses the selected relationship type of the currently active relationship dialog.
- Falls back to the default relationship type between the two entity types if there is no active dialog.

```js
javascript:(()=>{async function t(t){const i=await fetch("/ws/js/entity/"+t);return MB.entity(await i.json())}function i(t,i=!1){const e=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor;return new MB.relationshipEditor.UI.AddDialog({viewModel:e,source:e.source,target:t,backward:i})}async function e(e,o,a=!1){for(let n of e){const e=i(await t(n),a);o&&e.relationship().linkTypeID(o),e.accept()}}const o=prompt("MBIDs of entities which should be related to this entity:");if(o){const t=Array.from(o.matchAll(/[0-9a-f-]{36}/gm),t=>t[0]),i=(MB.sourceRelationshipEditor??MB.releaseRelationshipEditor).activeDialog();i?e(t,i.relationship().linkTypeID(),i.backward()):e(t)}})();
```

### [Show Qobuz Release Availability](src/bookmarklets/showQobuzReleaseAvailability.js)

- Shows all countries in which the currently visited Qobuz release is available.

```js
javascript:(()=>{const e=Array.from(document.querySelectorAll("head > link[rel=alternate]")).map(e=>e.hreflang).map(e=>e.split("-")[1]).filter((e,l,r)=>e&&r.indexOf(e)===l);alert(`Available in ${e.length} countries\n${e.sort().join(", ")}`)})();
```

### [View Discogs Entity Via API](src/bookmarklets/viewDiscogsEntityViaAPI.js)

- Views the API response for the currently visited Discogs entity (in a new tab).

```js
javascript:(()=>{const s=window.location.href.match(/(artist|label|master|release)\/(\d+)/)?.slice(1);s&&open(((s,e)=>`https://api.discogs.com/${s}s/${e}`)(...s))})();
```

## Development

Running `npm run build` compiles [all userscripts](src/userscripts/) and [all bookmarklets](src/bookmarklets/) before it generates an updated version of `README.md`. Before you can run this command you have to ensure that you have setup [Node.js](https://nodejs.org/) and have installed the dependencies of the build script via `npm install`.

If you want to compile a single minified bookmarklet from a module or a standalone JavaScript file you can run `node tools/bookmarkletify.js file.js`. The result will be output directly on screen and no files will be modified.
