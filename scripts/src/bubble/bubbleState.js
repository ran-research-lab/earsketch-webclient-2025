import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as helpers from 'helpers';
import { sampleScript } from "./bubbleData";

const bubbleSlice = createSlice({
    name: 'bubble',
    initialState: {
        active: false,
        currentPage: 0,
        readyToProceed: true,
        language: 'Python'
    },
    reducers: {
        reset(state) {
            state['active'] = false;
            state['currentPage'] = 0;
            state['readyToProceed'] = true;
            state['language'] = 'Python';
        },
        resume(state) { state['active'] = true },
        suspend(state) { state['active'] = false },
        increment(state) { state['currentPage']++ },
        setReady(state, { payload }) { state['readyToProceed'] = payload },
        setLanguage(state, { payload }) { state['language'] = payload }
    }
});

export const { reset, resume, suspend, increment, setReady, setLanguage } = bubbleSlice.actions;

const createSampleScript = createAsyncThunk(
    'bubble/createSampleScript',
    (_, { getState }) => {
        const language = getState().bubble.language;
        const fileName = `quick_tour.${language==='Python'?'py':'js'}`;
        const code = sampleScript[language.toLowerCase()];
        const userProject = helpers.getNgService('userProject');
        const rootScope = helpers.getNgService('$rootScope');
        return userProject.saveScript(fileName, code, true)
            .then(script => {
                userProject.openScript(script.shareid)

                // tabController also needs to call refresh.
                rootScope.$broadcast('createScript', script.shareid);
            });
    }
);

// TODO: These should belong to the layout reducer.
const deferLayoutChange = 100;

const hideSideBars = createAsyncThunk(
    'bubble/hideSideBars',
    async () => {
        const layoutScope = helpers.getNgController('layoutController').scope();

        return new Promise(resolve => {
            layoutScope.closeSidebarTabs();
            layoutScope.toggleLayoutToState('curriculum','close');
            setTimeout(resolve, deferLayoutChange);
        });
    }
);

const showBrowser = createAsyncThunk(
    'bubble/showBrowser',
    async (payload) => {
        const layoutScope = helpers.getNgController('layoutController').scope();

        return new Promise(resolve => {
            switch (payload) {
                case 'sounds':
                    layoutScope.openSidebarTab('sound');
                    break;
                case 'scripts':
                    layoutScope.openSidebarTab('script');
                    break;
                case 'API':
                    layoutScope.openSidebarTab('api');
                    break;
                default:
                    break;
            }
            setTimeout(resolve,deferLayoutChange);
        });
    }
);

const showCurriculum = createAsyncThunk(
    'bubble/showCurriculum',
    async () => {
        const layoutScope = helpers.getNgController('layoutController').scope();

        return new Promise(resolve => {
            layoutScope.toggleLayoutToState('curriculum','open');
            setTimeout(resolve,deferLayoutChange);
        });
    }
);

// TODO: Should be an action in the editor reducer.
const setEditorReadOnly = createAsyncThunk(
    'bubble/setEditorWritable',
    async (payload) => {
        return new Promise(resolve => {
            const editorScope = helpers.getNgDirective('editor').scope();
            editorScope.editor.setReadOnly(payload);
            setTimeout(resolve,deferLayoutChange);
        });
    }
);

export const dismissBubble = createAsyncThunk(
    'bubble/dismissBubble',
    (_, { dispatch }) => {
        dispatch(setEditorReadOnly(false));
        dispatch(suspend());
    }
);


export const proceed = createAsyncThunk(
    'bubble/proceed',
    async (payload, { getState, dispatch }) => {
        const { currentPage, readyToProceed } = getState().bubble;

        if (!readyToProceed) {
            return;
        }

        switch (currentPage) {
            case 0:
                await dispatch(hideSideBars());
                await dispatch(createSampleScript());
                await dispatch(setEditorReadOnly(true));
                break;
            case 1:
                dispatch(setReady(false));
                break;
            case 2:
            case 3:
            case 4:
                break;
            case 5:
                await dispatch(showBrowser('sounds'));
                break;
            case 6:
                await dispatch(showBrowser('scripts'));
                break;
            case 7:
                await dispatch(showCurriculum());
                break;
            case 8:
                await dispatch(setEditorReadOnly(false));
                break;
            default:
                return;
        }

        dispatch(increment());
    }
);

export default bubbleSlice.reducer;