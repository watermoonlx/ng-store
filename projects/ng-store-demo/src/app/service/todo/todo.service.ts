import { Injectable } from '@angular/core';
import { createEntityAdapter, NgStore } from 'ng-store';
import { ActionType, AddRequest, AddSucceed } from './actions';
import { initialState, State, TodoItem } from './state';
import { Observable, of } from 'rxjs';
import { delay, map, mergeMap } from 'rxjs/operators';
import { effect, ofType } from 'projects/ng-store/src/public-api';

/**
 * 响应Action，对当前State进行修改。
 * reducer要么修改当前State，要么返回一个新State，覆盖当前State。
 */
function reducer(state: State, action: ActionType) {
    const adapter = createEntityAdapter(state, i => i.id);
    switch (action.type) {
        case 'Add Succeed':
            adapter.addOne(action.payload);
            break;

        case 'Toggle Done':
            adapter.updateOne(action.payload, i => {
                i.isDone = !i.isDone;
            });
            break;

        case 'Delete':
            adapter.removeOne(action.payload);
            break;

        default: return;
    }
}

@Injectable()
export class TodoService extends NgStore<State, ActionType> {

    @effect({ description: '添加新Todo的流程' })
    private add$ = this.actions.pipe(
        ofType(AddRequest),
        map(i => i.payload),
        mergeMap(content => {
            return this.sendAddRequest(content).pipe(
                map(todo => new AddSucceed(todo))
            );
        })
    );

    constructor() {
        super(initialState, reducer);
    }

    private id = 0;
    private sendAddRequest(content: string): Observable<TodoItem> {
        return of({ id: this.id++, content, isDone: false }).pipe(
            delay(3000)
        );
    }
}
