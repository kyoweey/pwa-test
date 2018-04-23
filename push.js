'use strict';

let push = require('web-push');

const GCM_API_KEY = 'AAAAdIxsThA:APA91bHvLznEkGIGIg5yDlPJd_09miNg6zNd7vhxKy4j6xIJ3hIxoNXFLwFz9feYsgU3wjh-lvrP_ePBzClQFk4MZ567IN7z89mSK_kxkdzbjpydAuPLdG4jny9lbJARWRgM7TBZ50Fm';
push.setGCMAPIKey(GCM_API_KEY);

const data = {
    'endpoint': 'https://android.googleapis.com/gcm/send/cqbOP6srdYI:APA91bEycOtQv8jmPXATmsOnTGuDN4m-e6MJmbFSOGw_iU2jPM0o1EU44Jps0-pFOUFdW-FvOmh_aJoFUqvz1k3J6FOnJRPhCPn_SqCUgzzsgwrjWNJBoV39t8F3UNnvIyoX8sYgaTba',
    'userAuth': 'C5kqbD/Elm2iOcZ2lxiaAA==',
    'userPublicKey': 'BD7HPTMN4ADk84F4cezr8ofolB2l2jd2gD4onNXhs09a6PRO1nlDTjiQXOf6c77bn6OmrEmF0D/APlSbKikrxDs='
};

// A プッシュ通知
// A-2 プッシュ送信を実行する
// A-2-1 メッセージングサービスに送信したいデータを送信
push.sendNotification(data.endpoint, {
    payload:       'push test for service worker',
    userAuth:      data.userAuth,
    userPublicKey: data.userPublicKey,
})
.then((result) => {
        console.log("success!");
        console.log(result);
})
.catch((err) => {
        console.error('fail', err);
});
