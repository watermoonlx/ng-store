/** Todo项目 */
export interface TodoItem {
    id: number;
    content: string;
    isDone: boolean;
}

/**
 * State定义
 * 相当于数据表结构定义
 */
export interface State extends Array<TodoItem> {
}

/**
 * State初始状态
 * 相当于数据表初始状态
 */
export const initialState: State = [];
