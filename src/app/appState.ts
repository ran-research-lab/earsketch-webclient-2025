import { createSelector, createSlice } from "@reduxjs/toolkit"
import { persistReducer } from "redux-persist"
import storage from "redux-persist/lib/storage"

import * as ESUtils from "../esutils"
import type { RootState } from "../reducers"
import { AVAILABLE_LOCALES, ENGLISH_LOCALE } from "../locales/AvailableLocales"
import { Language } from "common"

// TODO: Remove `& any` and fix up type magic in `modal.ts`
export type Modal = (props: { [key: string]: any, close: (payload?: any) => void } & any) => JSX.Element

const embedMode = ESUtils.getURLParameter("embedded") === "true"
const hideDAW = embedMode && ESUtils.getURLParameter("hideDaw") !== null
const hideEditor = embedMode && ESUtils.getURLParameter("hideCode") !== null

const appSlice = createSlice({
    name: "app",
    initialState: {
        locale: "",
        scriptLanguage: "python" as Language,
        colorTheme: "light" as "light" | "dark",
        fontSize: 14,
        embedMode,
        hideDAW,
        hideEditor,
        doNotDisturb: false,
        embeddedScriptName: null as string | null,
        embeddedScriptUsername: null as string | null,
        embeddedShareID: null as string | null,
        modal: null as { Modal: Modal, resolve: (_: any) => void } | null,
        confetti: false,
    },
    reducers: {
        setScriptLanguage(state, { payload }) {
            state.scriptLanguage = payload
        },
        setColorTheme(state, { payload }) {
            state.colorTheme = payload
            // For the benefit of the loading screen:
            localStorage.setItem("colorTheme", payload)
        },
        setFontSize(state, { payload }) {
            state.fontSize = payload
        },
        // Perhaps these should go in another slice?
        setEmbedMode(state, { payload }) {
            state.embedMode = payload
        },
        setHideDAW(state, { payload }) {
            state.hideDAW = payload
        },
        setHideEditor(state, { payload }) {
            state.hideEditor = payload
        },
        setDoNotDisturb(state, { payload }) {
            state.doNotDisturb = payload
        },
        setEmbeddedScriptUsername(state, { payload }) {
            state.embeddedScriptUsername = payload
        },
        setEmbeddedScriptName(state, { payload }) {
            state.embeddedScriptName = payload
        },
        setEmbeddedShareID(state, { payload }) {
            state.embeddedShareID = payload
        },
        setLocaleCode(state, { payload }) {
            state.locale = payload
        },
        setModal(state, { payload }) {
            state.modal = payload
        },
        setConfetti(state, { payload }) {
            state.confetti = payload
        },
    },
})

const persistConfig = {
    key: "app",
    blacklist: ["embedMode", "hideDAW", "hideEditor", "embeddedScriptUsername", "embeddedScriptName", "embeddedShareID", "modal", "confetti"],
    storage,
}

export default persistReducer(persistConfig, appSlice.reducer)
export const {
    setScriptLanguage,
    setColorTheme,
    setFontSize,
    setEmbedMode,
    setHideDAW,
    setHideEditor,
    setDoNotDisturb,
    setEmbeddedScriptUsername,
    setEmbeddedScriptName,
    setEmbeddedShareID,
    setLocaleCode,
    setModal,
    setConfetti,
} = appSlice.actions

export const selectScriptLanguage = (state: RootState) => state.app.scriptLanguage
export const selectColorTheme = (state: RootState) => state.app.colorTheme
// TODO: Figure out the right way to do this with redux-persist.
export const selectFontSize = (state: RootState) => state.app.fontSize || 14
export const selectEmbedMode = (state: RootState) => state.app.embedMode
export const selectHideDAW = (state: RootState) => state.app.hideDAW
export const selectHideEditor = (state: RootState) => state.app.hideEditor
export const selectDoNotDisturb = (state: RootState) => state.app.doNotDisturb
export const selectEmbeddedScriptUsername = (state: RootState) => state.app.embeddedScriptUsername
export const selectEmbeddedScriptName = (state: RootState) => state.app.embeddedScriptName
export const selectEmbeddedShareID = (state: RootState) => state.app.embeddedShareID
export const selectLocaleCode = (state: RootState) => state.app.locale
export const selectModal = (state: RootState) => state.app.modal
export const selectConfetti = (state: RootState) => state.app.confetti

export const selectLocale = createSelector(
    [selectLocaleCode],
    (localeCode) => {
        return AVAILABLE_LOCALES[localeCode] ?? ENGLISH_LOCALE
    }
)
