import { Action } from 'ng-store';
import { TodoItem } from './state';


/** 添加一个Todo项目 */
// export class Add implements Action {
//     readonly type = 'Add';

//     constructor(public payload: TodoItem) { }
// }

/** 发送Add请求 */
export class AddRequest implements Action {
    readonly type = 'Add Request';

    constructor(public payload: string) { }
}

/** 后端返回Add成功响应 */
export class AddSucceed implements Action {
    readonly type = 'Add Succeed';

    constructor(public payload: TodoItem) { }
}

/** 切换一个Todo项目的完成标记 */
export class ToggleDone implements Action {
    readonly type = 'Toggle Done';

    constructor(public payload: number) { }
}

/** 移除一个Todo项目 */
export class Delete implements Action {
    readonly type = 'Delete';

    constructor(public payload: number) { }
}

export type ActionType =
    | AddRequest
    | AddSucceed
    | ToggleDone
    | Delete;
