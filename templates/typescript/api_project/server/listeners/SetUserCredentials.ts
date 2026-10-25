import {DataEventArgs} from '@themost/data';

export function beforeSave(event: DataEventArgs, callback: (err?: Error) => void) {
    return callback();
}

export function afterSave(event: DataEventArgs, callback: (err?: Error) => void) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const target: { id: number, userCredentials: { id: number } } = event.target;
    if (event.state === 1 && event.target && Object.prototype.hasOwnProperty.call(event.target, 'userCredentials')) {
        return event.model.context.model('UserCredential')
            .silent()
            .insert(Object.assign(target.userCredentials, {
                id: target.id
            }))
            .then(() => {
               return callback();
            })
            .catch( err => {
               return callback(err);
            });
    }
    return callback();
}
