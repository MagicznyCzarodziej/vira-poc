# Appendix — Function & state index

Index of the **current reference implementation** in `index.html` (optional). For product behavior and recreation requirements, use [`SPEC.md`](SPEC.md) and [`../GLOSSARY.md`](../GLOSSARY.md)—not this file.

## Runtime state (selected)

| Symbol | Purpose |
|--------|---------|
| `items`, `nextId` | Decision store and id generator |
| `viewMode`, `showAllDates`, `listFilterNotOnCanvas` | UI mode |
| `canvasPlacements`, `canvasViewport`, `canvasViewportUserSet` | Canvas layout |
| `openComposer`, `composerPendingTags`, `followupDrafts` | Creation flows |
| `pendingFocus`, `pendingEditableHandoff`, `pendingFollowupFocus` | Post-render focus |
| `inlineEditCommitByTa`, `pendingInlineEditCommit` | Inline commit deferral |
| `mentionMenu*`, `selectionRef*`, `refLinkPicker*` | Rich text UI |
| `issueDrawer*`, `issuePreview*`, `issuePanel*` | Reference panels |
| `canvasPointerState`, `canvasPanState`, `canvasHotspot` | Canvas input |
| `canvasSpawnDragActive`, `canvasSpawnPointerActive` | Spawn drag session |
| `canvasPlacedSizeCache`, `canvasViewportLock` | Layout optimization |
| `workspaceLinkHover`, `canvasRefLinkHover` | Cross-highlight |

Full list: see `index.html` script top (~2460–2610).

## Constants

`STORAGE_KEY`, `STORAGE_VERSION`, `PANEL_CARD_ID_PREFIX`, `CANVAS_CARD_ID_PREFIX`, `CANVAS_SPAWN_DRAG_TYPE`, `CANVAS_CARD_WIDTH`, `CANVAS_DROP_OFFSET_Y`, `CANVAS_WORLD_MIN_W/H`, `CANVAS_ZOOM_MIN/MAX`, `REF_PLACEHOLDER_*`, `TAG_PALETTE`, `MENTION_NAME_PATTERN`, `REF_EDITABLE_TEXTAREA_SEL`, `AUTO_GROW_TEXTAREA_SEL`, icon HTML constants.

---

## Functions (alphabetical)

| Function | Summary |
|----------|---------|
| `activeInlineFieldEdit` | Focused inline textarea/input in list/canvas/panel |
| `addRandomCards` | Insert fixture dataset |
| `addStep` | Append step from follow-up text |
| `addTagToItemTags` | Add normalized tag to item |
| `alignCanvasScrollAfterLayout` | Initial center when user has not set viewport |
| `allItemsOrdered` | Live items sorted by `compareItemIds` |
| `archiveStepAnswerField` | Archive answer revision + clear live answer |
| `compareItemIds` / `itemIdNumericSuffix` | Numeric sort for `item-N` ids |
| `allKnownMentions` | Union of @handles from all persisted text |
| `allKnownTags` | Sorted unique tags on items |
| `animateCanvasFlyStep` | RAF animation helper |
| `animateFlyToCardViewport` | Fly-to-card easing path |
| `animateWorldCenterAndZoom` | Interpolate center+zoom |
| `applyCanvasScrollLayout` | Apply zoom/size/scroll to DOM |
| `applyCanvasViewport` | Restore viewport after render |
| `applyCanvasRefLinkHover` | Store hover ref pair, draw line |
| `applySelectionRefPick` | Insert picked ref for selection |
| `applyTagFromTextarea` | Route #tag to item/composer |
| `applyWorkspaceListCanvasHover` | Sync list/canvas hover class |
| `archiveItem` | Soft-delete card |
| `archiveStep` | Soft-delete question |
| `archiveStepAnswer` | Soft-delete answer field |
| `appendFieldArchiveRevision` | Push archived empty head revision |
| `autoGrowTextarea` | Set height from scrollHeight |
| `bindCanvasInteractions` | One-time canvas/list drag listeners |
| `bindCanvasSurfaceWheel` | Wheel zoom + scroll sync |
| `bindIssuePreviewInteractions` | No-op placeholder |
| `bindIssueRefPreviewEvents` | Hover preview delegation |
| `bindRichTextAutocomplete` | @ ! # menus on textarea |
| `buildIssuePanelCardHistoryChrome` | Drawer card-history header |
| `buildIssuePanelDiffHtml` | Word diff panel body |
| `buildIssuePanelRefChrome` | Drawer field ref header |
| `buildIssuePreviewHtml` | Tooltip content |
| `buildIssueRefMarkdown` | `[label](token)` string |
| `buildSelectionRefPick` | Snapshot selection for picker |
| `cancelRefLinkPicker` | Close picker + resume commit |
| `canvasAssignOrderAtFront` | New max fractional order |
| `canvasClientPointAtViewportCenter` | Screen center of canvas |
| `canvasEaseInOut` | Easing curve |
| `canvasFakeScrollbarDragEnd/Move/Start` | Fake scrollbar drag |
| `canvasFakeScrollbarSetAxisVisible` | Fade axis visibility |
| `canvasFakeScrollbarSyncRootHidden` | Hide wrapper if idle |
| `canvasFakeScrollbarThumbMetrics` | Thumb geometry |
| `canvasFakeScrollbarPlacementMetrics` | H/V metrics |
| `canvasFakeScrollbarAxisMetrics` | Single axis metrics |
| `canvasFlyZoomForWorldSpan` | Fit zoom for bounds |
| `canvasGenerateKeyBetween` | Fractional order key |
| `canvasGenerateKeyBetweenFallback` | String fallback order |
| `canvasMaxScroll` | Max scrollLeft/Top |
| `canvasPlacedCardBoundsWorld` | Card rect in world space |
| `canvasPlacementsSortedIds` | Sort by order then id |
| `canvasPlacementsUnionBoundsWorld` | Bounding box all cards |
| `canvasPointFromClient` | Client → world point |
| `canvasRefLinksSvgEl` | SVG overlay element |
| `canvasScaledWorldSize` | World size × zoom |
| `canvasScrollContentEl` / `canvasWorldEl` / `canvasSurfaceEl` | DOM accessors |
| `canvasScrollForWorldCenter` | Scroll to center world point |
| `canvasSpawnPreviewItem` | Fake item for drag ghost |
| `canvasTypingFocus` | Is focus in editable control |
| `canvasViewportCenterClient/World` | Center helpers |
| `canvasWorldExtent` | Fixed world dimensions |
| `canvasWorldPadding` | Padding (zero) |
| `canvasZoomAt/ByFactor/Reset` | Zoom operations |
| `cardHistoryViewFromEvent` | Map history event → view state |
| `cardStatusClass` | incomplete/partial/complete |
| `centerCanvasViewport` | Layout + center |
| `centerCanvasViewportOnCard` | Scroll/zoom to card |
| `clearCanvasRefLinkHover` | Remove SVG highlight |
| `clearWorkspaceLinkHover` | Clear cross-highlight |
| `clearWorkspaceListCanvasHover` | Clear list half |
| `clampAllCanvasPlacementsToWorld` | Clamp all x/y |
| `clampCanvasPlacement` | Clamp one position |
| `clampCanvasViewportScroll` | Clamp scroll to content |
| `clampCanvasZoom` | Clamp zoom range |
| `clientRectBorderToward` | Edge point toward other card |
| `closeComposer` | Discard composer |
| `closeIssueRefDrawer` | Hide drawer |
| `closeRefLinkPickerPanel` | Hide picker shell |
| `collectCardHistoryEvents` | Flatten revision events |
| `collectRefLinkPickerTags` | Tag counts for picker |
| `commitFollowup` | Follow-up → new step |
| `consumeTrailingHashTag` | Promote #tag before commit |
| `createCardOnCanvasAtPointer` | C key create |
| `createItem` | New item record |
| `createNewCardOnCanvasAtClient` | Spawn drop/click canvas |
| `createNewCardOnList` | Spawn drop list |
| `deleteItem` | Alias archiveItem |
| `diffWordsOps` | LCS word diff |
| `editSurfaceFromElement` | panel/canvas flags |
| `editableHostForItem` | Root node for item UI |
| `endCanvasPan` | End pan gesture |
| `endCanvasSpawnDragSession` | End spawn drag + render |
| `ensureAllCanvasPlacementOrders` | Fill missing placement `order` keys |
| `ensureCanvasPlacementOrder` | Default order key for one placement |
| `ensureIssueDrawerShell` | Create drawer DOM |
| `ensurePanelViewRev` | Init drawer revision index |
| `ensureRefLinkPickerShell` | Create picker DOM |
| `ensureStepRevisions` | Backfill revision arrays |
| `escapeAttr` / `escapeHtml` | Safe strings |
| `expandIssueRefPlaceholders` | Restore ref buttons in HTML |
| `fieldRevAtHistoryEvent` | Rev at timeline index |
| `findEditableField` | Query field after render |
| `findFieldContainingIssueRef` | Search all text for ref |
| `findFollowupInput` | Scoped follow-up textarea |
| `finishEditableHandoff` | startInlineEdit handoff target |
| `firstHistoryEventIndexForStep` | Step birth in timeline |
| `flushActiveCanvasFieldEditForPointer` | Commit inline before pointer |
| `flushComposerOnOutsideClick` | Commit composer |
| `flyCanvasViewportToCard` | Animate to card |
| `formatDecisionDate` | dd.mm.yyyy |
| `formatIssueRefDisplay/InText/Suffix/Token` | Ref formatting |
| `formatRichText` | Escape + refs + mentions |
| `getAnswerText` / `getProblemText` | Revision-aware text |
| `getTextareaSelectionAnchor/Label` | Selection toolbar geometry |
| `goToIssue` | Open drawer entry |
| `hideSelectionRefToolbar` | Remove toolbar |
| `initIssuePanelCardHistoryView` | Default history selection |
| `initState` | load or seed |
| `insertHashTag` / `insertMention` / `insertIssueRef` | Autocomplete insert |
| `invalidateCanvasPlacedSizeCache` | Clear measured sizes |
| `isEnterSubmit` | Enter without shift |
| `isIssueRefStale` / `issueRefStaleReason` | Staleness |
| `isItemArchived` / `isStepArchived` | Archive flags |
| `isItemPlacedOnCanvas` | Placement check |
| `isRefEditableTextarea` | Eligible for ref toolbar |
| `isRefLinkableAnswer/Step` | Picker eligibility |
| `isRevisionArchivedEntry` | Revision flagged archived |
| `isSameCardHistorySelection` | Compare history UI state |
| `isTypingTagAtCursor` | # confirm UX |
| `issuePreviewStaleFooter` | Stale tooltip note |
| `issueRefAutocompleteLabel` | Menu row title |
| `issueRefExists` / `issueRefRevisionExists` | Target validation |
| `issueRefHrefNeedles` | Strings to replace on upgrade |
| `issueRefNewHrefForNeedle` | Preserve link style |
| `issueRefPanelStaleNotice/UpgradeHtml` | Drawer chrome |
| `issueRefPartsToToken` | Build token |
| `issueRefSameTarget` | Compare refs |
| `issueRefTitle` | Fallback title |
| `itemActiveSteps` / `liveItems` | Non-archived subsets |
| `itemNeedsDecision` | Board column helper |
| `itemTagChipsHtml` | Render tag chips |
| `itemsInColumn` | Board filtering |
| `listItemsForView` | List + filter |
| `loadState` / `saveState` / `scheduleSaveState` | Persistence |
| `lockCanvasViewportFromSurface` | Snapshot before render |
| `lockIssuePreviewDismiss` | Preview pointer grace |
| `mentionMenuItems` / `removeMentionMenu` | Autocomplete popup |
| `mountAutocompleteMenu` | Show popup |
| `normalizeCanvasViewport` | scrollLeft/scrollTop/zoom from saved object |
| `normalizeIssueId` / `normalizeStep` / `normalizeTagName` / `normalizeItemTags` | Load-time shape cleanup |
| `normalizeTagsList` | Dedupe/lowercase tag array |
| `noteEditableSwitchFromTarget` | Record handoff targets |
| `onCanvasSurfaceScroll` / `onCanvasWheel` | Canvas listeners |
| `openIssueRefDrawer` / `openRefLinkPickerPanel` | Open panels |
| `panelAllRevisionNumbers` etc. | Drawer revision math |
| `panelHighlightRef` | Drawer snapshot highlight |
| `panelRefField/Step` | Drawer context |
| `parseIssueRef` / `parseTags` | Parsers |
| `pinCurrentIssueRefRevision` | Pin @vN at head |
| `placeCardOnCanvas` | Set placement + render |
| `populateIssueRefDrawer` / `populateRefLinkPickerResults` | Panel content |
| `popCanvasPlacedCard` / `popListCard` | Reveal animation |
| `positionIssuePreview` / `positionSelectionRefToolbar` | Float UI |
| `prepareCanvasSpawnDragGhost/Pointer` | Spawn drag prep |
| `recordAnswerEdit` / `recordProblemEdit` | Append revisions |
| `removeFromCanvas` | Delete placement |
| `removeIssuePreview` | Clear tooltip |
| `render` | Full UI rebuild |
| `renderBoardView` / `renderListView` | View HTML |
| `renderCanvas*` / `renderCard` / `renderTimelineStep` | Partial HTML |
| `renderCardHistoryTimelineHtml` | History list |
| `renderComposerHtml` / `renderGroupedCards` | List pieces |
| `renderIssueRef` | Ref button HTML |
| `renderRevisionHistoryHtml` | Revision list |
| `renderWordDiffHtml` | Diff display |
| `replaceIssueRefRevisionInText` | Upgrade pin in text |
| `replaceTextareaRangeWithIssueRef` | Picker insert |
| `recomputeNextId` | Max item-N |
| `resolveIssueRefSourceField` | Find link source |
| `resolveTagTargetItemId` | #tag target |
| `revealReferencedItemInWorkspace` | List+canvas reveal |
| `revisionEntry` / `revisionFieldText` / `revisionTimelineBody` | Revision helpers |
| `saveActiveFieldEditWithoutRender` | Spawn-drag save |
| `saveComposer` | Create from composer |
| `scheduleCanvasShellOverlayUpdate` | RAF overlays |
| `scheduleHideIssuePreview` | Delay hide |
| `scheduleSaveState` | Debounced save |
| `scrollListToItem` | Smooth scroll list |
| `seed` / `removeAllCards` | Default/reset data |
| `setCanvasSpawnDragImage` | Drag image |
| `setCanvasViewportWorldCenter` | Set scroll+zoom |
| `setMentionMenuHighlight` / `setView` | UI state |
| `setStepFieldHeadText` | Patch head without new rev |
| `shouldFlushCanvasFieldEditForTarget` | Pointer commit gate |
| `showIssuePreview` | Show tooltip |
| `startInlineEdit` | DOM → inputs |
| `stepFieldHeadRev/Revisions` | Accessors |
| `stepFullyResolved/Resolved` | Status |
| `stepMatchesHighlight` | Ref highlight |
| `stepPanelViewRev` | Drawer rev step |
| `stepVisibleAtHistoryEvent` | Timeline filter |
| `syncAutoGrowTextareas` | Batch grow |
| `syncCanvasHotspot` | C key target |
| `syncCanvasShellOverlays` | Lines + scrollbars |
| `syncCanvasSurfaceScrollImmediate` | Write scroll DOM |
| `syncCanvasViewport` | Apply + label |
| `syncCardTagsRow` | Update tag chips |
| `syncComposerTagsRow` | Composer chips |
| `syncIssueRefPanelOpenClass` | Body class |
| `tagColorIndex` / `tagStyle` | Tag colors |
| `tokenizeDiff` | Diff tokens |
| `toggleAnswerTentative` | ⚑ toggle |
| `toggleRefLinkPickerTag` | Picker filter |
| `truncateLabel` | Ellipsis |
| `tryAutocompleteMenuKeydown` | Menu keys |
| `tryCommitComposerField/FollowupField` | Blur commits |
| `tryConfirmTagAtCursor` | # enter |
| `tryStartCanvasPan` | Begin pan |
| `uid` | New item id |
| `updateCanvasFakeScrollbars/RefLinkLines*` | Overlay sync |
| `updateCanvasZoomControlLabel` | % label |
| `updateSelectionRefToolbar` | Show/hide toolbar |
| `upgradeIssueRefLink` | Shift-click fix |
| `whenListBodyScrollFinishes` | Scroll end callback |

---

## Event binding map (summary)

| Target | Events |
|--------|--------|
| `.header-right` | click (view, dates, fixtures) |
| `#app-body` | pointerdown/up (flush, spawn), mousedown (handoff), click (actions), input, focusout, keydown, keyup |
| `#app` | canvas pointer/drag/wheel/hover (once via bindCanvasInteractions) |
| `document` | keydown (Escape drawer), mouseup (selection toolbar) |
| `window` | beforeunload, canvas-fidx-ready, pointermove (hotspot), keydown/keyup/blur (C, Space) |

See **SPEC.md §14** and exploration doc for capture-phase details.
