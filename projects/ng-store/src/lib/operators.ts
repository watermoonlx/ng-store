import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Action, Ctor } from './entities';
import { getOrSetActionType } from './utils';

export const ofType = <T extends Action>(...actions: Array<Ctor<T>>) =>
    (source: Observable<Action>) => {
        if (actions.length === 1) {
            return source.pipe(filter(i => i.type === getOrSetActionType(actions[0]))) as Observable<T>;
        } else {
            return source.pipe(filter(i => {
                for (const action of actions) {
                    if (i.type === getOrSetActionType(action)) {
                        return true;
                    }
                }
                return false;
            })) as Observable<T>;
        }
    };
