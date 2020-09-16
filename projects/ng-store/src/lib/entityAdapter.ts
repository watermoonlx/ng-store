import * as _ from 'lodash';

export type KeyValue = string | number;
export type KeyGenerator<TEntry> = (e: TEntry) => KeyValue;

export class EntityAdapter<TEntry> {

    constructor(
        private state: TEntry[],
        private uniqueKey: keyof TEntry | KeyGenerator<TEntry>
    ) {
    }

    addOne(entry: Partial<TEntry>) {
        this.state.push(entry as TEntry);
    }

    addMany(entryList: Array<Partial<TEntry>>) {
        this.state.push(...entryList as any);
    }

    updateOne(condition: Partial<TEntry> | KeyValue, act?: (e: TEntry) => void) {

        const target = this.getTarget(condition);
        if (_.isNull(target) || _.isUndefined(target)) {
            return;
        }

        if (!act) {
            Object.assign(target, condition);
        } else {
            act(target);
        }
    }

    removeOne(condition: Partial<TEntry> | KeyValue) {
        const target = this.getTarget(condition);
        if (_.isNull(target) || _.isUndefined(target)) {
            return;
        }

        _.remove(this.state, i => i === target);
    }

    private getTarget(condition: Partial<TEntry> | KeyValue) {
        if (typeof this.uniqueKey === 'function') {
            const keyGen = this.uniqueKey as KeyGenerator<TEntry>;
            if (_.isObject(condition)) {
                return this.state.find(i => keyGen(i) === keyGen(condition as any));
            } else {
                return this.state.find(i => keyGen(i) === condition);
            }
        } else {
            const key = this.uniqueKey as string;
            if (_.isObject(condition)) {
                return this.state.find(i => i[key] === condition[key]);
            } else {
                return this.state.find(i => i[key] === condition);
            }
        }
    }
}

export function createEntityAdapter<TEntry>(state: TEntry[], uniqueKey: keyof TEntry | KeyGenerator<TEntry>) {
    return new EntityAdapter<TEntry>(state, uniqueKey);
}
