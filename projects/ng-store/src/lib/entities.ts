export interface Action {
    readonly type: string;
    payload?: any;
}

export interface EffectMetadata {
    propName: string;
    description?: string;
    dispatch?: boolean;
}

export interface EffectOption {
    description?: string;
    dispatch?: boolean;
}

export type Ctor<T> = new (param?: any) => T;
