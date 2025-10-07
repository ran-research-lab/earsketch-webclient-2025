import { createAsyncThunk } from "@reduxjs/toolkit"

import * as app from "../app/appState"
import * as editor from "./ideState"
import * as scripts from "../browser/scriptsState"
import * as scriptsThunks from "../browser/scriptsThunks"
import type { ThunkAPI } from "../reducers"
import { addTabSwitch } from "../cai/dialogue/student"
import reporter from "../app/reporter"
import { selectActiveTabID, selectOpenTabs, selectModifiedScripts, openAndActivateTab, closeTab as pureCloseTab, removeModifiedScript, resetModifiedScripts, resetTabs as pureResetTabs } from "./tabState"
import { createSession, getSession, deleteSession, deleteAllSessions, setActiveSession, setReadOnly } from "./Editor"

// Wrap side-effect-free reducers from `tabState` to also update mutable state.
export const closeTab = createAsyncThunk<void, string, ThunkAPI>(
    "tabs/resetTabs",
    (scriptID, { dispatch }) => {
        dispatch(pureCloseTab(scriptID))
        deleteSession(scriptID)
    }
)

export const resetTabs = createAsyncThunk<void, void, ThunkAPI>(
    "tabs/resetTabs",
    (_, { dispatch }) => {
        dispatch(pureResetTabs())
        deleteAllSessions()
    }
)

export const setActiveTabAndEditor = createAsyncThunk<void, string, ThunkAPI>(
    "tabs/setActiveTabAndEditor",
    (scriptID, { getState, dispatch }) => {
        const prevTabID = selectActiveTabID(getState())
        const script = scripts.selectAllScripts(getState())[scriptID]

        if (!script) return

        let editSession
        const language = script.name.slice(-2) === "py" ? "python" : "javascript"

        const restoredSession = getSession(scriptID)
        if (restoredSession) {
            editSession = restoredSession
        } else {
            editSession = createSession(scriptID, language, script.source_code)
        }
        setActiveSession(editSession)

        dispatch(app.setScriptLanguage(language))
        setReadOnly(script.readonly)

        if (prevTabID && scriptID !== prevTabID) {
            dispatch(editor.setScriptMatchesDAW(false))
        }

        if (!selectOpenTabs(getState()).includes(scriptID)) {
            reporter.openScript()
        }
        dispatch(openAndActivateTab(scriptID))
        addTabSwitch(script.name)
    }
)

export const closeAndSwitchTab = createAsyncThunk<void, string, ThunkAPI>(
    "tabs/closeAndSwitchTab",
    (scriptID, { getState, dispatch }) => {
        const openTabs = selectOpenTabs(getState())
        const activeTabID = selectActiveTabID(getState())
        const closedTabIndex = openTabs.indexOf(scriptID)
        const script = scripts.selectAllScripts(getState())[scriptID]

        dispatch(saveScriptIfModified(scriptID))

        if (openTabs.length === 1) {
            dispatch(resetTabs())
        } else if (activeTabID !== scriptID) {
            dispatch(closeTab(scriptID))
            if (activeTabID !== null) {
                addTabSwitch(scripts.selectAllScripts(getState())[activeTabID].name)
            }
        } else if (openTabs.length > 1 && closedTabIndex === openTabs.length - 1) {
            const nextActiveTabID = openTabs[openTabs.length - 2]
            dispatch(setActiveTabAndEditor(nextActiveTabID))
            dispatch(closeTab(scriptID))
        } else if (closedTabIndex < openTabs.length - 1) {
            const nextActiveTabID = openTabs[closedTabIndex + 1]
            dispatch(setActiveTabAndEditor(nextActiveTabID))
            dispatch(closeTab(scriptID))
        }
        deleteSession(scriptID)
        script.readonly && dispatch(scripts.removeReadOnlyScript(scriptID))
    }
)

export const closeAllTabs = createAsyncThunk<void, void, ThunkAPI>(
    "tabs/closeAllTabs",
    (_, { getState, dispatch }) => {
        if (editor.selectBlocksMode(getState())) {
            dispatch(editor.setBlocksMode(false))
        }

        const openTabs = selectOpenTabs(getState())

        openTabs.forEach(scriptID => {
            dispatch(saveScriptIfModified(scriptID))
            dispatch(closeTab(scriptID))
            deleteSession(scriptID)

            const script = scripts.selectAllScripts(getState())[scriptID]
            script.readonly && dispatch(scripts.removeReadOnlyScript(scriptID))
        })

        // These are probably redundant except for resetting the activeTabID.
        dispatch(resetTabs())
        dispatch(resetModifiedScripts())
        dispatch(scripts.resetReadOnlyScripts())
    }
)

export const saveScriptIfModified = createAsyncThunk<void, string, ThunkAPI>(
    "tabs/saveScriptIfModified",
    async (scriptID, { getState, dispatch }) => {
        const state = getState()
        const modified = selectModifiedScripts(state).includes(scriptID)
        if (modified) {
            const script = scripts.selectAllScripts(state)[scriptID]
            await dispatch(scriptsThunks.saveScript({ name: script.name, source: script.source_code })).unwrap()
            dispatch(removeModifiedScript(scriptID))
        }
    }
)

export const closeDeletedScript = createAsyncThunk<void, string, ThunkAPI>(
    "tabs/closeDeletedScript",
    (scriptID, { getState, dispatch }) => {
        const openTabs: string[] = selectOpenTabs(getState())
        if (openTabs.includes(scriptID)) {
            dispatch(closeAndSwitchTab(scriptID))
        }
    }
)
