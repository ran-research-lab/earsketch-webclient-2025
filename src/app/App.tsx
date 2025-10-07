import i18n from "i18next"
import { Dialog, Menu, Popover, Transition } from "@headlessui/react"
import { Fragment, useEffect, useState } from "react"
import { getI18n, useTranslation } from "react-i18next"
import { useAppDispatch as useDispatch, useAppSelector as useSelector } from "../hooks"

import { AccountCreator } from "./AccountCreator"
import { AdminWindow } from "./AdminWindow"
import * as appState from "../app/appState"
import * as audioLibrary from "./audiolibrary"
import { Bubble } from "../bubble/Bubble"
import * as bubble from "../bubble/bubbleState"
import { ConfettiLauncher } from "./Confetti"
import * as caiState from "../cai/caiState"
import * as caiThunks from "../cai/caiThunks"
import { Script, SoundEntity } from "common"
import { CompetitionSubmission } from "./CompetitionSubmission"
import * as curriculum from "../browser/curriculumState"
import { Download } from "./Download"
import { ErrorForm } from "./ErrorForm"
import { ForgotPassword } from "./ForgotPassword"
import esconsole from "../esconsole"
import * as ESUtils from "../esutils"
import { IDE, openShare } from "../ide/IDE"
import * as layout from "../ide/layoutState"
import { chooseDetectedLanguage, LocaleSelector } from "../top/LocaleSelector"
import { openModal } from "./modal"
import { NotificationBar, NotificationHistory, NotificationList, NotificationPopup } from "../user/Notifications"
import { ProfileEditor } from "./ProfileEditor"
import { RenameScript, RenameSound } from "./Rename"
import reporter from "./reporter"
import { ScriptAnalysis } from "./ScriptAnalysis"
import { ScriptHistory } from "./ScriptHistory"
import { ScriptShare } from "./ScriptShare"
import * as scriptsState from "../browser/scriptsState"
import * as scriptsThunks from "../browser/scriptsThunks"
import { ScriptDropdownMenu } from "../browser/ScriptsMenus"
import * as sounds from "../browser/Sounds"
import * as soundsState from "../browser/soundsState"
import * as soundsThunks from "../browser/soundsThunks"
import { SoundUploader } from "./SoundUploader"
import store, { persistor } from "../reducers"
import * as tabs from "../ide/tabState"
import * as tabThunks from "../ide/tabThunks"
import * as user from "../user/userState"
import * as userNotification from "../user/notification"
import * as request from "../request"
import { ModalBody, ModalFooter, ModalHeader, Prompt, PromptChoice } from "../Utils"
import * as websocket from "./websocket"

import esLogo from "./ES_logo_extract.svg"
import LanguageDetector from "i18next-browser-languagedetector"
import { AVAILABLE_LOCALES, ENGLISH_LOCALE } from "../locales/AvailableLocales"
import HeaderBanner from "./HeaderBanner"

// TODO: Temporary workaround for autograder and code analyzer, which replace the prompt function.
(window as any).esPrompt = async (message: string) => {
    return (await openModal(Prompt, { message })) ?? ""
}
(window as any).esPromptChoice = async (message: string, choices: string[]) => {
    return (await openModal(PromptChoice, { message, choices, allowMultiple: false })) ?? 0
}

(window as any).esPromptChoicesMultiple = async (message: string, choices: string[]) => {
    return (await openModal(PromptChoice, { message, choices, allowMultiple: true })) ?? []
}

const FONT_SIZES = [10, 12, 14, 18, 24, 36]

curriculum.callbacks.redirect = () => userNotification.show("Failed to load curriculum link. Redirecting to welcome page.", "failure2", 2)

function renameSound(sound: SoundEntity) {
    openModal(RenameSound, { sound })
}

async function deleteSound(sound: SoundEntity) {
    if (await confirm({ textKey: "messages:confirm.deleteSound", textReplacements: { soundName: sound.name }, okKey: "script.delete", type: "danger" })) {
        try {
            await request.postAuth("/audio/delete", { name: sound.name })
            esconsole("Deleted sound: " + sound.name, ["debug", "user"])
        } catch (err) {
            esconsole(err, ["error", "userproject"])
        }
        store.dispatch(soundsThunks.deleteLocalUserSound(sound.name))
        audioLibrary.clearCache() // TODO: This is probably overkill.
    }
}

function openUploadWindow() {
    if (user.selectLoggedIn(store.getState())) {
        openModal(SoundUploader)
    } else {
        userNotification.show(i18n.t("messages:general.unauthenticated"), "failure1")
    }
}

sounds.callbacks.rename = renameSound
sounds.callbacks.delete = deleteSound
sounds.callbacks.upload = openUploadWindow

function loadLocalScripts() {
    // Migration code: if any anonymous users have saved scripts from before PR #198, bring them in to Redux state.
    const LS_SCRIPTS_KEY = "scripts_v1"
    const scriptData = localStorage.getItem(LS_SCRIPTS_KEY)
    if (scriptData !== null) {
        const scripts = JSON.parse(scriptData) as { [key: string]: Script }
        store.dispatch(scriptsState.setRegularScripts(Object.assign({}, scriptsState.selectRegularScripts(store.getState()), scripts)))
        localStorage.removeItem(LS_SCRIPTS_KEY)
    }

    // Back up active tab. (See comment below re. setActiveTabAndEditor.)
    const activeTab = tabs.selectActiveTabID(store.getState())
    const openTabs = tabs.selectOpenTabs(store.getState())
    for (const scriptID of openTabs) {
        // TODO: Right now, setActiveTabAndEditor is the only action that creates new editor sessions.
        // This is unfortunate, because we don't actually want to change the active tab here - just create the editor session.
        store.dispatch(tabThunks.setActiveTabAndEditor(scriptID))
    }
    store.dispatch(tabThunks.setActiveTabAndEditor(activeTab!))
}

// Only add but not open a shared script (view-only) shared by another user. Script is added to the shared-script browser.
// Returns a Promise if a script is actually added, and undefined otherwise (i.e. the user already had it, or isn't logged in).
function addSharedScript(shareID: string, refresh: boolean = true) {
    if (user.selectLoggedIn(store.getState())) {
        const sharedScripts = scriptsState.selectSharedScripts(store.getState())
        if (sharedScripts[shareID] === undefined) {
            return (async () => {
                const script = await scriptsThunks.loadScript(shareID, true)
                await scriptsThunks.saveSharedScript(shareID, script.name, script.source_code, script.username)
                if (refresh) {
                    await store.dispatch(scriptsThunks.getSharedScripts()).unwrap()
                }
            })()
        }
    }
}

// Login, setup, restore scripts, return shared scripts.
async function postLogin(username: string) {
    esconsole("Using username: " + username, ["debug", "user"])
    reporter.login(username)

    // register callbacks / member values in the userNotification service
    userNotification.callbacks.addSharedScript = id => addSharedScript(id, false)
    userNotification.callbacks.getSharedScripts = () => store.dispatch(scriptsThunks.getSharedScripts())

    // used for managing websocket notifications locally
    userNotification.user.loginTime = Date.now()

    esconsole("List of scripts in Load script list successfully updated.", ["debug", "user"])

    if (ES_WEB_SHOW_CAI || ES_WEB_SHOW_CHAT) {
        store.dispatch(caiState.resetState())
    }

    // Migrate scripts created or imported while logged out to the user's account.
    const state = store.getState()
    const saved = scriptsState.selectRegularScripts(state)
    const openTabs = tabs.selectOpenTabs(state)

    // Fetch the user's scripts now that they're logged in.
    // (We need to do this now in case there are name conflicts when migrating anonymous scripts below.)
    await refreshScriptBrowser()

    const promises = []
    for (const script of Object.values(saved)) {
        if (script.soft_delete) {
            // Don't migrate scripts the user deleted while logged out.
            continue
        }
        let promise
        if (script.original_id !== undefined) {
            promise = scriptsThunks.importSharedScript(script.original_id)
        } else {
            promise = store.dispatch(scriptsThunks.saveScript({
                name: script.name,
                source: script.source_code,
                overwrite: false,
                ...(script.creator === "earsketch" && { creator: "earsketch" }),
            })).unwrap()
        }
        const reopen = openTabs.includes(script.shareid)
        promise = promise.then(script => ({ script, reopen }))
        promises.push(promise)
    }

    if (promises.length > 0) {
        store.dispatch(tabThunks.resetTabs())

        const results = await Promise.all(promises)
        // Re-open scripts that were opened before login (which now have new IDs).
        // TODO: Ideally, we would preserve the order of the open tabs.
        for (const { script, reopen } of results) {
            if (reopen) {
                store.dispatch(tabThunks.setActiveTabAndEditor(script.shareid))
            }
        }
    }

    const shareID = ESUtils.getURLParameter("sharing")
    const sharedScripts = scriptsState.selectSharedScripts(store.getState())
    if (shareID && sharedScripts[shareID]) {
        // User opened share link, and they haven't imported or deleted the shared script.
        await openShare(shareID)
    }

    // load scripts in shared browser
    await store.dispatch(scriptsThunks.getSharedScripts()).unwrap()
    // Wait to receive websocket notifications until *after* we have the list of existing shared scripts.
    // This prevents us from re-adding shared scripts when we get a bunch of unread share notifications.
    websocket.login(username)
}

async function refreshScriptBrowser() {
    if (user.selectLoggedIn(store.getState())) {
        const fetchedScripts: Script[] = await request.getAuth("/scripts/owned")

        store.dispatch(scriptsState.resetRegularScripts())

        const scripts: { [key: string]: Script } = {}
        for (const script of fetchedScripts) {
            // set this flag to false when the script gets modified
            // then set it to true when the script gets saved
            script.saved = true
            script.tooltipText = ""
            scripts[script.shareid] = script
        }
        store.dispatch(scriptsState.setRegularScripts(scripts))
    } else {
        throw new Error("This should never be called for anonymous users.")
    }
}

export async function renameScript(script: Script) {
    const name = await openModal(RenameScript, { script })
    if (!name) return
    try {
        // exception occurs below if api call fails
        await scriptsThunks.renameScript(script, name)
    } catch {
        userNotification.show(i18n.t("messages:createaccount.commerror"), "failure1")
        return
    }
    reporter.renameScript()
}

export function downloadScript(script: Script) {
    openModal(Download, { script })
}

export async function openScriptHistory(script: Script, allowRevert: boolean) {
    if (!script.isShared) {
        // saveScript() saves regular scripts - if called for shared scripts, it will create a local copy (#2663).
        await store.dispatch(scriptsThunks.saveScript({ name: script.name, source: script.source_code })).unwrap()
    }
    store.dispatch(tabs.removeModifiedScript(script.shareid))
    openModal(ScriptHistory, { script, allowRevert })
    reporter.openHistory()
}

export function openCodeIndicator(script: Script) {
    openModal(ScriptAnalysis, { script })
}

export function openAdminWindow() {
    openModal(AdminWindow)
}

const Confirm = ({ textKey, textReplacements, okKey, cancelKey, type, close }: { textKey?: string, textReplacements?: { [key: string]: string }, okKey?: string, cancelKey?: string, type?: string, close: (ok: boolean) => void }) => {
    const { t } = useTranslation()
    return <>
        <ModalHeader>{t("confirm")}</ModalHeader>
        <form onSubmit={e => { e.preventDefault(); close(true) }}>
            <ModalBody>
                {textKey && <div className="modal-body">{textReplacements ? t(textKey, textReplacements) : t(textKey)}</div>}
            </ModalBody>
            <ModalFooter submit={okKey ?? "ok"} cancel={cancelKey} type={type} close={() => close(false)} />
        </form>
    </>
}

function confirm({ textKey, textReplacements, okKey, cancelKey, type }: { textKey?: string, textReplacements?: { [key: string]: string }, okKey?: string, cancelKey?: string, type?: string }) {
    return openModal(Confirm, { textKey, textReplacements, okKey, cancelKey, type })
}

async function deleteScriptHelper(scriptid: string) {
    if (user.selectLoggedIn(store.getState())) {
        // User is logged in so make a call to the web service
        try {
            const script = await request.postAuth("/scripts/delete", { scriptid })
            esconsole("Deleted script: " + scriptid, "debug")

            const scripts = scriptsState.selectRegularScripts(store.getState())
            if (scripts[scriptid]) {
                script.modified = Date.now()
                store.dispatch(scriptsState.setRegularScripts({ ...scripts, [scriptid]: script }))
            } else {
                // script doesn't exist
            }
        } catch (err) {
            esconsole("Could not delete script: " + scriptid, "debug")
            esconsole(err, ["user", "error"])
        }
    } else {
        // User is not logged in so alter local storage
        const scripts = scriptsState.selectRegularScripts(store.getState())
        const script = { ...scripts[scriptid], soft_delete: true }
        store.dispatch(scriptsState.setRegularScripts({ ...scripts, [scriptid]: script }))
    }
}

async function deleteScript(script: Script) {
    if (await confirm({ textKey: "messages:confirm.deletescript", okKey: "script.delete", type: "danger" })) {
        await store.dispatch(scriptsThunks.saveScript({ name: script.name, source: script.source_code })).unwrap()
        await deleteScriptHelper(script.shareid)
        reporter.deleteScript()

        store.dispatch(tabThunks.closeDeletedScript(script.shareid))
        store.dispatch(tabs.removeModifiedScript(script.shareid))
    }
}

export async function deleteSharedScript(script: Script) {
    if (await confirm({ textKey: "messages:confirm.deleteSharedScript", textReplacements: { scriptName: script.name }, okKey: "script.delete", type: "danger" })) {
        if (user.selectLoggedIn(store.getState())) {
            await request.postAuth("/scripts/deleteshared", { scriptid: script.shareid })
            esconsole("Deleted shared script: " + script.shareid, "debug")
        }
        const { [script.shareid]: _, ...sharedScripts } = scriptsState.selectSharedScripts(store.getState())
        store.dispatch(scriptsState.setSharedScripts(sharedScripts))
        store.dispatch(tabThunks.closeDeletedScript(script.shareid))
        store.dispatch(tabs.removeModifiedScript(script.shareid))
    }
}

export async function submitToCompetition(script: Script) {
    await store.dispatch(scriptsThunks.saveScript({ name: script.name, source: script.source_code })).unwrap()
    store.dispatch(tabs.removeModifiedScript(script.shareid))
    const shareID = await scriptsThunks.getLockedSharedScriptId(script.shareid)
    openModal(CompetitionSubmission, { name: script.name, shareID })
}

export async function importScript(script: Script) {
    if (!script) {
        script = tabs.selectActiveTabScript(store.getState())!
    }

    let imported
    try {
        // exception occurs below if api call fails
        imported = await scriptsThunks.importScript(script)
    } catch {
        userNotification.show(i18n.t("messages:createaccount.commerror"), "failure1")
        return
    }

    if (!imported) {
        return
    }

    const openTabs = tabs.selectOpenTabs(store.getState())
    store.dispatch(tabThunks.closeTab(script.shareid))

    if (openTabs.includes(script.shareid)) {
        store.dispatch(tabThunks.setActiveTabAndEditor(imported.shareid))
    }
}

export async function closeAllTabs() {
    if (await confirm({ textKey: "messages:idecontroller.closealltabs", okKey: "tabs.closeAll" })) {
        try {
            await scriptsThunks.saveAll()
            userNotification.show(i18n.t("messages:user.allscriptscloud"))
            store.dispatch(tabThunks.closeAllTabs())
        } catch {
            userNotification.show(i18n.t("messages:idecontroller.saveallfailed"), "failure1")
        }
    }
}

export async function shareScript(script: Script) {
    script = Object.assign({}, script) // copy to avoid mutating original
    await store.dispatch(scriptsThunks.saveScript({ name: script.name, source: script.source_code })).unwrap()
    store.dispatch(tabs.removeModifiedScript(script.shareid))
    openModal(ScriptShare, { script })
}

export function openSharedScript(shareID: string) {
    esconsole("opening a shared script: " + shareID, "main")
    openShare(shareID).then(() => {
        store.dispatch(tabThunks.setActiveTabAndEditor(shareID))
    })
}

function toggleColorTheme() {
    store.dispatch(appState.setColorTheme(store.getState().app.colorTheme === "light" ? "dark" : "light"))
    reporter.toggleColorTheme()
}

function resumeQuickTour() {
    store.dispatch(bubble.reset())
    store.dispatch(bubble.resume())
}

function reportError() {
    openModal(ErrorForm, { email })
}

function forgotPass() {
    openModal(ForgotPassword)
}

const KeyboardShortcuts = () => {
    const isMac = ESUtils.whichOS() === "MacOS"
    const modifier = isMac ? "Cmd" : "Ctrl"
    const { t } = useTranslation()

    const localize = (key: string) => key.length > 1 ? t(`hardware.${key.toLowerCase()}`) : key

    const shortcuts = {
        run: [modifier, "Enter"],
        save: [modifier, "S"],
        undo: [modifier, "Z"],
        redo: [modifier, "Shift", "Z"],
        comment: [modifier, "/"],
        playPause: ["Ctrl", "Space"],
        zoomHorizontal: <>
            <kbd>{modifier}</kbd>+<kbd>{localize("Wheel")}</kbd> or <kbd>+</kbd>/<kbd>-</kbd>
        </>,
        zoomVertical: [modifier, "Shift", "Wheel"],
        escapeEditor: <><kbd>{localize("Esc")}</kbd> followed by <kbd>{localize("Tab")}</kbd></>,
    }

    return <Popover>
        <Popover.Button className="text-gray-400 hover:text-gray-300 text-2xl mx-6" title={t("ariaDescriptors:header.shortcuts")} aria-label={t("ariaDescriptors:header.shortcuts")}>
            <i className="icon icon-keyboard" />
        </Popover.Button>
        <Popover.Panel className="absolute z-10 mt-1 bg-gray-100 shadow-lg p-2 -translate-x-1/2 w-max">
            <table>
                <tbody>
                    {Object.entries(shortcuts).map(([action, keys], index, arr) =>
                        <tr key={action} className={index === arr.length - 1 ? "" : "border-b"}>
                            <td className="text-sm p-2">{t(`shortcuts.${action}`)}</td>
                            <td>{Array.isArray(keys)
                                ? keys.map(key => <kbd key={key}>{localize(key)}</kbd>).reduce((a: any, b: any): any => [a, " + ", b])
                                : keys}
                            </td>
                        </tr>)}
                </tbody>
            </table>
        </Popover.Panel>
    </Popover>
}

const FontSizeMenu = () => {
    const dispatch = useDispatch()
    const fontSize = useSelector(appState.selectFontSize)
    const { t } = useTranslation()

    return <Menu as="div" className="relative inline-block text-left mx-3">
        <Menu.Button className="text-gray-400 hover:text-gray-300 text-2xl" title={t("ariaDescriptors:header.fontSize")} aria-label={t("ariaDescriptors:header.fontSize")}>
            <div className="flex flex-row items-center">
                <div><i className="icon icon-font-size2" /></div>
                <div className="ml-1"><span className="caret" /></div>
            </div>
        </Menu.Button>
        <Menu.Items className="absolute z-50 right-0 mt-1 origin-top-right bg-gray-100 divide-y divide-gray-100 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {FONT_SIZES.map(size =>
                <Menu.Item key={size}>
                    {({ active }) =>
                        <button className={`${active ? "bg-gray-500 text-white" : "text-gray-900"} text-sm inline-grid grid-flow-col justify-items-start items-center px-1.5 py-1 w-full`}
                            onClick={() => dispatch(appState.setFontSize(size))}
                            title={fontSize === size ? t("ariaDescriptors:general.selected") : t("ariaDescriptors:general.notSelected")}
                            aria-label={fontSize === size ? t("ariaDescriptors:general.selected") : t("ariaDescriptors:general.notSelected")}
                            style={{ gridTemplateColumns: "18px 1fr" }}
                            aria-selected={fontSize === size}>
                            {fontSize === size && <i className="mr-1.5 icon icon-checkmark4" />}
                            {fontSize !== size && <span></span>}
                            {size}
                        </button>}
                </Menu.Item>)}
        </Menu.Items>
    </Menu>
}

const SwitchThemeButton = () => {
    const { t } = useTranslation()
    const colorTheme = useSelector(appState.selectColorTheme)
    const titleKey = colorTheme === "light" ? "switchThemeLight" : "switchThemeDark"

    return <div className="relative inline-block text-left mx-3">
        <button className="text-gray-400 hover:text-gray-300 text-2xl" onClick={toggleColorTheme} title={t(titleKey)} aria-label={t(titleKey)}>
            <div className="flex flex-row items-center">
                <div><i className="icon icon-brightness-contrast" /></div>
            </div>
        </button>
    </div>
}

const MiscActionMenu = () => {
    const { t } = useTranslation()

    const actions = [
        { nameKey: "startQuickTour", action: resumeQuickTour },
        { nameKey: "reportError", action: reportError },
    ]

    const links = [
        { nameKey: "whatsNew", linkUrl: "https://earsketch.gatech.edu/landing/#/releases" },
        { nameKey: "footer.teachers", linkUrl: "https://www.teachers.earsketch.org/" },
        { nameKey: "footer.help", linkUrl: "https://earsketch.gatech.edu/landing/#/contact" },
    ]

    return <Menu as="div" className="relative inline-block text-left mx-3">
        <Menu.Button className="text-gray-400 hover:text-gray-300 text-2xl" title={t("ariaDescriptors:header.settings")} aria-label={t("ariaDescriptors:header.settings")}>
            <div className="flex flex-row items-center">
                <div><i className="icon icon-info" /></div>
                <div className="ml-1"><span className="caret" /></div>
            </div>
        </Menu.Button>
        <Menu.Items className="whitespace-nowrap absolute z-50 right-0 mt-1 origin-top-right bg-gray-100 divide-y divide-gray-100 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {actions.map(({ nameKey, action }) =>
                <Menu.Item key={nameKey}>
                    {({ active }) => <button className={`${active ? "bg-gray-500 text-white" : "text-gray-900"} text-sm group flex items-center w-full px-2 py-1`} onClick={action}>
                        {t(nameKey)}
                    </button>}
                </Menu.Item>)}
            {links.map(({ nameKey, linkUrl }) =>
                <Menu.Item key={nameKey}>
                    {({ active }) => <a className={`${active ? "bg-gray-500 text-white" : "text-gray-900"} text-sm group flex items-center w-full px-2 py-1`} href={linkUrl} target="_blank" rel="noreferrer">
                        {t(nameKey)} <span className="icon icon-new-tab ml-1"></span>
                    </a>}
                </Menu.Item>)}
            <Menu.Item>
                <div className="text-xs px-2 py-0.5 items-center group text-gray-700 bg-gray-200">
                    <a className="text-gray-700" href="https://earsketch.gatech.edu/landing/#/releases" target="_blank" rel="noreferrer">
                        V{`${BUILD_NUM}`.split("-")[0]}
                    </a>
                </div>
            </Menu.Item>
        </Menu.Items>
    </Menu>
}

const NotificationMenu = () => {
    const notifications = useSelector(user.selectNotifications)
    const numUnread = notifications.filter(v => v && (v.unread || v.notification_type === "broadcast")).length
    const { t } = useTranslation()

    const [showHistory, setShowHistory] = useState(false)

    return <>
        {showHistory && <NotificationHistory openSharedScript={openSharedScript} close={() => setShowHistory(false)} />}
        <Popover>
            <Popover.Button className="text-gray-400 hover:text-gray-300 text-2xl mx-3 relative" title={t("ariaDescriptors:header.toggleNotifications")}>
                <i className="icon icon-bell" />
                {numUnread > 0 && <div role="status" aria-label={t("ariaDescriptors:header.unreadNotifications", { numUnread })} className="text-sm w-4 h-4 text-white bg-red-600 rounded-full absolute top-0 -right-1 leading-none" data-test="numUnreadNotifications">{numUnread}</div>}
            </Popover.Button>
            <div className="relative right-1">
                <NotificationPopup />
            </div>
            <Popover.Panel className="absolute z-10 mt-1 bg-gray-100 shadow-lg p-2 -translate-x-3/4">
                {({ close }) => <NotificationList
                    openSharedScript={openSharedScript}
                    showHistory={setShowHistory}
                    close={close}
                />}
            </Popover.Panel>
        </Popover>
    </>
}

const LoginMenu = ({ loggedIn, isAdmin, username, password, setUsername, setPassword, login, logout }: {
    loggedIn: boolean, isAdmin: boolean, username: string, password: string,
    setUsername: (u: string) => void, setPassword: (p: string) => void,
    login: (u: string, p: string) => void, logout: () => void,
}) => {
    const { t } = useTranslation()

    const createAccount = async () => {
        const result = await openModal(AccountCreator)
        if (result) {
            setUsername(result.username)
            login(result.username, result.password)
        }
    }

    const editProfile = async () => {
        const newEmail = await openModal(ProfileEditor, { username, email })
        if (newEmail !== undefined) {
            email = newEmail
        }
    }

    return <>
        {!loggedIn &&
        <form className="flex items-center" onSubmit={e => { e.preventDefault(); login(username, password) }}>
            <input type="text" className="text-sm" autoComplete="on" name="username" title={t("formfieldPlaceholder.username")} aria-label={t("formfieldPlaceholder.username")} value={username} onChange={e => setUsername(e.target.value)} placeholder={t("formfieldPlaceholder.username")} required />
            <input type="password" className="text-sm" autoComplete="current-password" name="password" title={t("formfieldPlaceholder.password")} aria-label={t("formfieldPlaceholder.password")} value={password} onChange={e => setPassword(e.target.value)} placeholder={t("formfieldPlaceholder.password")} required />
            <button type="submit" className="whitespace-nowrap text-xs bg-white text-black hover:text-black hover:bg-gray-200" style={{ marginLeft: "6px", padding: "2px 5px 3px" }} title="Login" aria-label="Login">GO <i className="icon icon-arrow-right" /></button>
        </form>}
        <Menu as="div" className="relative inline-block text-left mx-3">
            <Menu.Button className="text-gray-400">
                {loggedIn
                    ? <div className="text-black bg-gray-400 whitespace-nowrap py-1 px-2 rounded-md" role="button">{username}<span className="caret" /></div>
                    : <div className="whitespace-nowrap py-1 px-2 text-xs bg-white text-black hover:text-black hover:bg-gray-200" role="button" style={{ marginLeft: "6px", height: "23px" }} title={t("createResetAccount")} aria-label={t("createResetAccount")}>{t("createResetAccount")}</div>}
            </Menu.Button>
            <Menu.Items className="whitespace-nowrap absolute z-50 right-0 mt-1 origin-top-right bg-gray-100 divide-y divide-gray-100 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {(loggedIn
                    ? [{ name: t("editProfile"), action: editProfile }, ...(isAdmin ? [{ name: "Admin Window", action: openAdminWindow }] : []), { name: t("logout"), action: logout }]
                    : [{ name: t("registerAccount"), action: createAccount }, { name: t("forgotPassword.title"), action: forgotPass }])
                    .map(({ name, action }) =>
                        <Menu.Item key={name}>
                            {({ active }) => <button className={`${active ? "bg-gray-500 text-white" : "text-gray-900"} text-sm group flex items-center w-full px-2 py-1`} onClick={action}>{name}</button>}
                        </Menu.Item>)}
            </Menu.Items>
        </Menu>
    </>
}

function setup() {
    store.dispatch(soundsThunks.getStandardSounds())
    if (ES_WEB_SHOW_FEATURED_SOUNDS) {
        store.dispatch(soundsState.setFeaturedSoundVisibility(true))
    }
    if (ES_WEB_FEATURED_ARTISTS && ES_WEB_FEATURED_ARTISTS.length) {
        store.dispatch(soundsState.setFeaturedArtists(ES_WEB_FEATURED_ARTISTS))
    }

    esconsole.updateLevelsFromURLParameters()

    const isEmbedded = appState.selectEmbedMode(store.getState())

    if (isEmbedded) {
        store.dispatch(appState.setColorTheme("light"))
    } else {
        loadLocalScripts()
    }

    // If in CAI study mode, switch to active CAI view.
    if (ES_WEB_SHOW_CAI || ES_WEB_SHOW_CHAT) {
        store.dispatch(layout.setEast({ open: true, kind: "CAI" }))
    }
}

// TODO: Move to userState.
let email = ""

// Defunct localStorage key that contained username and password
const USER_STATE_KEY = "userstate"
const userstate = localStorage.getItem(USER_STATE_KEY)
const savedLoginInfo = userstate === null ? undefined : JSON.parse(userstate)

export const App = () => {
    const dispatch = useDispatch()
    const theme = useSelector(appState.selectColorTheme)
    const showCai = useSelector(layout.selectEastKind) === "CAI"
    const caiHighlight = useSelector(caiState.selectHighlight)
    const switchedToCurriculum = useSelector(caiState.selectSwitchedToCurriculum)
    const switchedToCai = useSelector(caiState.selectSwitchedToCai)

    const [username, setUsername] = useState(savedLoginInfo?.username ?? "")
    const [password, setPassword] = useState(savedLoginInfo?.password ?? "")
    const [isAdmin, setIsAdmin] = useState(false)
    const [loggedIn, setLoggedIn] = useState(false)
    const embedMode = useSelector(appState.selectEmbedMode)
    const { t, i18n } = useTranslation()
    const currentLocale = useSelector(appState.selectLocaleCode)

    // Note: Used in api_doc links to the curriculum Effects chapter.
    ;(window as any).loadCurriculumChapter = (url: string) => {
        dispatch(curriculum.open(url))
    }

    const sharedScriptID = ESUtils.getURLParameter("sharing")

    const changeLanguage = (lng: string) => {
        reporter.localeSelection(lng, false)
        dispatch(appState.setLocaleCode(lng))
        dispatch(curriculum.fetchLocale({ }))
    }

    useEffect(() => {
        (async () => {
            document.getElementById("loading-screen")!.style.display = "none"

            // Attempt to load userdata from a previous session.
            if (savedLoginInfo) {
                await login(username, password).then(() => {
                    // Remove defunct localStorage key
                    localStorage.removeItem(USER_STATE_KEY)
                }).catch((error: Error) => {
                    if (window.confirm("We are unable to automatically log you back in to EarSketch. Press OK to reload this page and log in again.")) {
                        localStorage.clear()
                        window.location.reload()
                        esconsole(error, ["error"])
                        reporter.exception("Auto-login failed. Clearing localStorage.")
                    }
                })
            } else {
                const token = user.selectToken(store.getState())
                if (token !== null) {
                    await relogin(token)
                }
            }

            setup()

            if (!user.selectLoggedIn(store.getState())) {
                const openTabs = tabs.selectOpenTabs(store.getState())
                const allScripts = scriptsState.selectAllScripts(store.getState())
                for (const scriptID of openTabs) {
                    if (!allScripts[scriptID]) {
                        store.dispatch(tabThunks.closeAndSwitchTab(scriptID))
                    }
                }
                // Show bubble tutorial when not opening a share link or in a CAI study mode.
                if (Object.keys(allScripts).length === 0 && !sharedScriptID && !ES_WEB_SHOW_CAI && !ES_WEB_SHOW_CHAT) {
                    store.dispatch(bubble.resume())
                }
            }
        })()
    }, [])

    useEffect(() => {
        if (theme === "dark") {
            document.body.classList.add("dark")
        } else {
            document.body.classList.remove(("dark"))
        }
    }, [theme])

    useEffect(() => {
        if (currentLocale === "") {
            // locale hasn't been set yet, attempt to detect language
            const languageDetector = new LanguageDetector(getI18n().services, { order: ["navigator"] })
            const language = languageDetector.detect()
            console.log("languages detected: ", language)
            changeLanguage(chooseDetectedLanguage(language))
        } else if (Object.keys(AVAILABLE_LOCALES).includes(currentLocale)) {
            i18n.changeLanguage(currentLocale)
        } else {
            changeLanguage(ENGLISH_LOCALE.localeCode)
        }
    }, [currentLocale])

    const login = async (username: string, password: string) => {
        esconsole("Logging in", ["DEBUG", "MAIN"])
        scriptsThunks.saveAll()

        let token
        try {
            token = await request.getBasicAuth("/users/token", username, password)
        } catch (error) {
            userNotification.show(i18n.t("messages:general.loginfailure"), "failure1", 3.5)
            esconsole(error, ["main", "login"])
            return
        }

        await relogin(token)
    }

    const relogin = async (token: string) => {
        let userInfo
        try {
            userInfo = await request.get("/users/info", {}, { Authorization: "Bearer " + token })
        } catch {
            userNotification.show("Your credentials have expired. Please login again with your username and password.", "failure1", 3.5)
            dispatch(user.logout())
            return
        }
        const username = userInfo.username

        store.dispatch(user.login({ username, token }))

        store.dispatch(soundsThunks.getUserSounds(username))
        store.dispatch(soundsThunks.getFavorites(token))

        // Always override with the returned username in case the letter cases mismatch.
        setUsername(username)
        setIsAdmin(userInfo.isAdmin)
        email = userInfo.email
        userNotification.user.isAdmin = userInfo.isAdmin

        // Retrieve the user scripts.
        await postLogin(username)
        esconsole("Logged in as " + username, ["DEBUG", "MAIN"])

        if (!loggedIn) {
            setLoggedIn(true)
            userNotification.show(i18n.t("messages:general.loginsuccess"), "history", 0.5)
            const activeTabID = tabs.selectActiveTabID(store.getState())
            activeTabID && store.dispatch(tabThunks.setActiveTabAndEditor(activeTabID))
        }
    }

    const logout = async () => {
        let keepUnsavedTabs = false
        // save all unsaved open scripts
        try {
            const promise = scriptsThunks.saveAll()
            await promise
            if (promise) {
                userNotification.show(i18n.t("messages:user.allscriptscloud"))
            }
        } catch (error) {
            if (await confirm({ textKey: "messages:idecontroller.saveallfailed", cancelKey: "discardChanges", okKey: "keepUnsavedTabs" })) {
                keepUnsavedTabs = true
            }
        }

        localStorage.clear()
        if (ES_WEB_SHOW_CAI || ES_WEB_SHOW_CHAT) {
            store.dispatch(caiState.resetState())
        }
        websocket.logout()
        userNotification.clearHistory()
        reporter.logout()

        if (keepUnsavedTabs) {
            // Close unmodified tabs/scripts.
            const state = store.getState()
            const modified = tabs.selectModifiedScripts(state)
            for (const tab of tabs.selectOpenTabs(state)) {
                if (!modified.includes(tab)) {
                    dispatch(tabThunks.closeAndSwitchTab(tab))
                }
            }
            const regularScripts = scriptsState.selectRegularScripts(state)
            const modifiedScripts = Object.entries(regularScripts).filter(([id, _]) => modified.includes(id))
            dispatch(scriptsState.setRegularScripts(ESUtils.fromEntries(modifiedScripts)))
        } else {
            dispatch(tabThunks.resetTabs())
            dispatch(tabs.resetModifiedScripts())
            dispatch(scriptsState.resetRegularScripts())
        }

        dispatch(scriptsState.resetSharedScripts())
        dispatch(scriptsState.resetReadOnlyScripts())

        dispatch(user.logout())
        dispatch(soundsState.resetUserSounds())
        dispatch(soundsState.resetFavorites())
        dispatch(soundsState.resetAllFilters())

        // Clear out all the values set at login.
        setUsername("")
        setPassword("")
        setLoggedIn(false)

        // User data
        email = ""
        setIsAdmin(false)
    }

    const toggleCaiWindow = () => {
        if (!showCai) {
            dispatch(layout.setEast({ open: true, kind: "CAI" }))
            dispatch(caiState.setHasSwitchedToCai(true))
            dispatch(caiThunks.closeCurriculum())
            if (caiHighlight.zone === "curriculumButton") {
                dispatch(caiThunks.highlight({ zone: null }))
            }
            dispatch(caiThunks.autoScrollCai())
        } else {
            dispatch(layout.setEast({ kind: "CURRICULUM" }))
            dispatch(caiState.setHasSwitchedToCurriculum(true))
            dispatch(caiThunks.curriculumPage([curriculum.selectCurrentLocation(store.getState()), curriculum.selectPageTitle(store.getState())]))
            if (caiHighlight.zone === "curriculumButton") {
                dispatch(caiThunks.highlight({ zone: "curriculumSearchBar" }))
            }
        }
    }

    return <>
        <nav role="navigation">
            <ul className="skip-links">
                <li><a href="#content-manager">{t("ariaDescriptors:skipLink.contentManager")}</a></li>
                <li><a href="#dawHeader">{t("ariaDescriptors:skipLink.daw")}</a></li>
                <li><a href="#coder">{t("ariaDescriptors:skipLink.editor")}</a></li>
                <li><a href="#curriculum-header">{t("ariaDescriptors:skipLink.curriculum")}</a></li>
                <li><a href="#top-header-nav-form">{t("ariaDescriptors:skipLink.navigation")}</a></li>
            </ul>
        </nav>

        <div className="flex flex-col justify-start h-screen max-h-screen">
            {!embedMode && <header role="banner" id="top-header-nav" className="shrink-0">
                <div className="w-full flex items-center">
                    <a href="http://earsketch.gatech.edu/landing" target="_blank" rel="noreferrer" className="flex items-center" tabIndex={0}>
                        <img className="h-[26px] mx-2.5 min-w-[41px]" src={esLogo} alt="EarSketch Logo"/>
                        <h1 className="text-2xl text-white">EarSketch</h1>
                    </a>
                    {ES_WEB_SHOW_COMPETITION_BANNER && <HeaderBanner />}
                </div>

                {/* for easter egg in passthrough.ts */}
                <ConfettiLauncher/>

                {/* temporary place for the app-generated notifications */}
                <NotificationBar/>

                {/* top-right icons */}
                <div id="top-header-nav-form">
                    {/* CAI-window toggle */}
                    {(ES_WEB_SHOW_CAI || ES_WEB_SHOW_CHAT) &&
                        <button className="top-header-nav-button btn" style={{ color: showCai ? "white" : "#939393" }}
                            onClick={toggleCaiWindow} title="CAI">
                            <i
                                id="caiButton"
                                className={`icon icon-bubbles ${((caiHighlight.zone && (caiHighlight.zone === "curriculumButton")) || !switchedToCurriculum || !switchedToCai) && "text-yellow-500 animate-pulse"}`}
                            >
                            </i>
                        </button>}

                    {ES_WEB_SHOW_LOCALE_SWITCHER && <LocaleSelector handleSelection={changeLanguage}/>}
                    <KeyboardShortcuts />
                    <FontSizeMenu />
                    <SwitchThemeButton />
                    <MiscActionMenu />
                    <NotificationMenu />
                    <LoginMenu {...{ loggedIn, isAdmin, username, password, setUsername, setPassword, login, logout }} />
                </div>
            </header>}
            <IDE closeAllTabs={closeAllTabs} importScript={importScript} shareScript={shareScript} downloadScript={downloadScript} />
        </div>
        <Bubble />
        <ScriptDropdownMenu
            delete={deleteScript}
            deleteShared={deleteSharedScript}
            download={downloadScript}
            openIndicator={openCodeIndicator}
            openHistory={openScriptHistory}
            rename={renameScript}
            share={shareScript}
            submit={submitToCompetition}
        />
        <ModalContainer />
    </>
}

export const ModalContainer = () => {
    const dispatch = useDispatch()
    const modalData = useSelector(appState.selectModal)!
    const { Modal, resolve } = modalData ?? { Modal: null, resolve: null }

    useEffect(() => {
        setClosing(false)
    }, [Modal])

    const [closing, setClosing] = useState(false)

    const close = () => {
        setClosing(true)
        resolve(undefined) // This has no effect if the modal already resolved with a payload.
        setTimeout(() => {
            if (modalData === appState.selectModal(store.getState())) {
                dispatch(appState.setModal(null))
                setClosing(false)
            }
        }, 300)
    }

    return <Transition appear show={Modal !== null && !closing} as={Fragment}>
        <Dialog
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
            onClose={close}
        >
            <div className="min-h-screen px-4 text-center">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-40" />
                </Transition.Child>

                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <div className="inline-block w-full max-w-3xl mt-10 overflow-hidden text-left transition-all transform bg-white dark:bg-gray-900 shadow-xl rounded-xl">
                        {Modal && <Modal close={close} />}
                    </div>
                </Transition.Child>
            </div>
        </Dialog>
    </Transition>
}

// websocket gets closed before onunload in FF
window.onbeforeunload = () => {
    if (user.selectLoggedIn(store.getState())) {
        // Show page-close warning if saving.
        // NOTE: For now, the cross-browser way to show the warning if to return a string in beforeunload. (Someday, the right way will be to call preventDefault.)
        // See https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event.
        const promise = scriptsThunks.saveAll()
        if (promise) {
            promise.then(() => userNotification.show(i18n.t("messages:user.allscriptscloud"), "success"))
            return ""
        }
    }
    persistor.flush()
}
