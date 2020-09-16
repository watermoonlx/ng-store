import { Ctor } from './entities';
import * as moment_ from 'moment';
const moment = moment_;
import * as _ from 'lodash';

export const getOrSetActionType = (() => {
    const actionMap = new Map<Ctor<any>, string>();
    return (actionCtor: Ctor<any>) => {
        let type: string = actionMap.get(actionCtor);
        if (!type) {
            const actionIns = new actionCtor(null);
            type = actionIns.type;
            actionMap.set(actionCtor, type);
        }
        return type;
    };
})();

export const usaDateTimeFormat = 'MM/DD/YYYY HH:mm:ss';
const reg_dotnet_date = new RegExp('^/Date\(.*\)/$');
const reg_dotnet_date_number = /\d+(?=[-+])/;
const reg_js_date_string = /^\d{4}-\d{2}-\d{2}/;

export function format(date: Date, format?: string) {
    return moment(date).format(format);
}

export function toUsaDateTimeText(date: Date, defaultText = 'N/A') {
    return !!date ? format(date, usaDateTimeFormat) : defaultText;
}

/**
 * 替换Date类的默认toJSON方法，避免转换为UTC时间。
 * @param target 待转换对象。
 */
export function replaceDateToJsonFormat(target: any) {
    if (!target) {
        return;
    }

    if (moment.isDate(target)) {
        // 抹除所有时区相关信息。
        target.toJSON = () => moment(target).format('YYYY-MM-DD HH:mm:ss');
        return;
    }

    if (_.isArray(target)) {
        for (const i of target) {
            replaceDateToJsonFormat(i);
        }
        return;
    }

    if (_.isFunction(target)) {
        return;
    }

    if (_.isObject(target)) {
        for (const prop of Object.getOwnPropertyNames(target)) {
            replaceDateToJsonFormat(target[prop]);
        }
    }
}

export function convertStringToDate(target: any) {
    if (_.isDate(target)) {
        return target;
    } else if (_.isString(target)) {
        if (isJsDateString(target)) {
            return new Date(target);
        }
        if (isDotNetDateString(target)) {
            const ms_number = target.match(reg_dotnet_date_number)[0];
            return moment(parseInt(ms_number)).toDate();
        }
    } else if (_.isArray(target)) {
        const cloned = target.map(i => convertStringToDate(i));
        return cloned;
    } else if (target instanceof Blob) {
        return target;
    } else if (_.isObject(target)) {
        const cloned = {};
        for (const prop of Object.getOwnPropertyNames(target)) {
            cloned[prop] = convertStringToDate(target[prop]);
        }
        return cloned;
    }

    return target;
}

function isDotNetDateString(obj: any): boolean {
    return reg_dotnet_date.test(obj);
}

function isJsDateString(obj: string): boolean {
    // 满足xxxx-xx-xx且满足ISO_8601时间格式。
    // bug1：'2018-1-1.png'，被误识别为时间。
    // bug2：'4471161'，被误识别为时间。
    return reg_js_date_string.test(obj) && moment(obj, moment.ISO_8601, true).isValid();
}
