import { EffectMetadata, EffectOption } from './entities';

export const EFFECT_METAKEY = Symbol.for('Effect Metakey');

/**
 * 通常用于将一个Action映射为另一个或多个Action。
 * 也可用于处理副作用，即订阅指定的Action，当其出现时执行某些操作，但是不将其转化为其他Action。
 */
export function effect(option: EffectOption = {}) {
    return (prototype: any, propName: string) => {
        const defaultMetadata = {
            propName,
            dispatch: true
        } as EffectMetadata;

        const metadata = { ...defaultMetadata, ...option };

        prototype[EFFECT_METAKEY] = [...prototype[EFFECT_METAKEY] || [], metadata];
    };
}

export function getEffectMetadata(instance: any): EffectMetadata[] {
    return Object.getPrototypeOf(instance)[EFFECT_METAKEY] || [];
}
