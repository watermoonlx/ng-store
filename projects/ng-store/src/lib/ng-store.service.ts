import { OnDestroy } from '@angular/core';
import { produce } from 'immer';
import * as _ from 'lodash';
import { Selector } from 'reselect';
import { BehaviorSubject, from, merge, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, mergeMap, scan, take, takeUntil } from 'rxjs/operators';
import { getEffectMetadata } from './decorators';
import { Action } from './entities';
import { convertStringToDate } from './utils';


function enableDevTool() {
    return (window as any)?.enableDevTool
        && (window as any)?.devToolsExtension;
}

const LOAD_STATE_FROM_LOCAL_STORAGE = '[Common]Load State From Local Storage';

export class NgStore<State, ActionType> implements OnDestroy {

    private static storeID = 0;

    protected destroyed$ = new Subject<void>();

    private _identifier: string;
    private get identifier() {
        if (!this._identifier) {
            this._identifier = `${this.constructor.name}_${NgStore.storeID++}`;
        }
        return this._identifier;
    }

    private readonly state$: BehaviorSubject<State>;
    get state(): Observable<State> {
        return this.state$.asObservable()
            .pipe(
                distinctUntilChanged()
            );
    }

    get stateSnapshot() {
        return this.state$.getValue();
    }

    private readonly actions$: Subject<ActionType> = new Subject<ActionType>();
    get actions(): Observable<ActionType> {
        return this.actions$.asObservable();
    }

    private readonly devTool: any = enableDevTool()
        ? (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({ name: this.identifier })
        : undefined;

    constructor(
        private readonly initialState: State,
        private readonly reducer: (state: State, action: ActionType) => State | void
    ) {
        this.state$ = new BehaviorSubject<State>(initialState);
        Promise.resolve().then(() => {
            this.init();
        });
    }

    ngOnDestroy() {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    private init() {
        this.buildEffects();
        this.buildReducer();
        this.buildDevTool();
    }

    /**
     * 订阅其他Store的actions
     */
    protected subscribe(...stores: Array<NgStore<any, any>>) {
        const otherStoreActions = stores
            .filter(i => !!i)
            .map(i => i.actions)
            .filter(i => !!i);

        if (!otherStoreActions || otherStoreActions.length === 0)
            return;

        merge(...otherStoreActions).pipe(
            takeUntil(this.destroyed$)
        ).subscribe(this.actions$);
    }

    private buildEffects() {
        let effectPropMetadatas = getEffectMetadata(this);

        if (!effectPropMetadatas) {
            return;
        }

        // 过滤掉标记为effect，但实际为null的effect
        effectPropMetadatas = effectPropMetadatas.filter(metadata => !!this[metadata.propName]);

        if (effectPropMetadatas.length === 0) {
            return;
        }

        from(effectPropMetadatas).pipe(
            mergeMap(metadata => {
                return (this[metadata.propName] as Observable<ActionType | ActionType[]>).pipe(
                    map(i => ({
                        metadata,
                        resultAction: i
                    }))
                );
            }),
            filter(i => !!i),
            takeUntil(this.destroyed$)
        )
            .subscribe(({ metadata, resultAction }) => {
                if (metadata.dispatch) {
                    if (_.isArray(resultAction)) {
                        this.dispatch(...resultAction as ActionType[]);
                    } else {
                        this.dispatch(resultAction as ActionType);
                    }
                }
            });
    }

    private buildReducer() {
        const _reducer = this.reducer.bind(undefined);
        this.actions$.pipe(
            scan<ActionType, State>((prevState, action) => {
                let newState = prevState;
                if ((action as any).type === LOAD_STATE_FROM_LOCAL_STORAGE) {
                    newState = (action as any).payload;
                } else {
                    newState = produce(prevState, (draft) => _reducer(draft as any, action));
                }
                this.log(action, newState);
                return newState;
            }, this.initialState),
            takeUntil(this.destroyed$)
        ).subscribe(this.state$);
    }

    private buildDevTool() {
        if (this.devTool) {
            this.devTool.init(this.initialState);
            this.devTool.subscribe(message => {
                if (message.type === 'DISPATCH' && message.state) {
                    this.state$.next(JSON.parse(message.state));
                }
            });
            this.destroyed$.subscribe(() => {
                this.devTool.unsubscribe();
            });
        }
    }

    private log(action: any, state: State) {
        if (this.devTool) {
            this.devTool.send(action, state);
        }
    }

    dispatch(...actions: ActionType[]) {
        for (const action of actions) {
            this.actions$.next(action);
        }
    }

    select<R>(selector: Selector<State, R>): Observable<R> {
        return this.state
            .pipe(
                map(i => selector(i)),
                distinctUntilChanged()
            );
    }

    /**
     * 将state保存到LocalStorage
     */
    saveStateToLocalStorage() {
        this.state.pipe(
            take(1)
        ).subscribe(s => {
            localStorage.setItem(`PO_${this.constructor.name}`, JSON.stringify(s));
            this.log({ type: '将state保存到LocalStorage' }, s);
        });
    }

    /**
     * 从LocalStorage恢复State
     */
    loadStateFromLocalStorage(clearStorageAfterLoad = true) {
        const key = `PO_${this.constructor.name}`;
        let state = localStorage.getItem(key);
        if (!!state) {
            state = convertStringToDate(JSON.parse(state));
            const action = {
                type: LOAD_STATE_FROM_LOCAL_STORAGE,
                payload: state
            } as Action;
            //  这里必须通过触发Action来进行更新，这样才能下次Dispatch Action时，PrevState为当前值，而非initialState。
            this.actions$.next(action as any);
            if (clearStorageAfterLoad) this.clearLocalStorage();
        }
    }

    clearLocalStorage() {
        const key = `PO_${this.constructor.name}`;
        localStorage.removeItem(key);
    }
}
