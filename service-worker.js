var dataCacheName = 'playerData-v1';
var cacheName = 'playerPWA-v1';
var filesToCache = [
      './',
      './index.php',
      './index.html',
      './scripts/app.js',
      '/styles/inline.css',
      '/images/ic_add_white_24px.svg'
    ];

// self.addEventListener('updatefound', function(e) {
//   console.log('updatefound', e);
// });

self.addEventListener('install', function(e) {
  var dataUrl = 'https://spreadsheets.google.com/feeds/list/12jXEVD4-zvfF3puYm5Xl0TW6MM8qQ51l0dz3HjCaKHI/od6/public/values?alt=json';
  console.log('ServiceWorker-Install');
  // Service Worker 更新時に waiting 状態をスキップしたい場合
  // event.waitUntil(self.skipWaiting());
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('ServiceWorker-Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('ServiceWorker-Activate');
  // すぐにControllerになって欲しい時は claim を呼ぶ
  // event.waitUntil(self.clients.claim());
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(
        keyList.map(function(key) {
          // ホワイトリストにないキャッシュ(古いキャッシュ)は削除する
          if (key !== cacheName && key !== dataCacheName) {
            console.log('ServiceWorker-Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// self.addEventListener('controllerChange'), function(e) {
//   console.log('controllerChange')
// };

self.addEventListener('fetch', function(e) {
  console.log('Service Worker-Fetch', e.request.url);
  var dataUrl = 'https://spreadsheets.google.com/feeds/list/12jXEVD4-zvfF3puYm5Xl0TW6MM8qQ51l0dz3HjCaKHI/od6/public/values?alt=json';
  if (e.request.url.indexOf(dataUrl) > -1) {
    e.respondWith(
      caches.open(dataCacheName).then(function(cache) {
        return fetch(e.request).then(function(response){
          // 重要：リクエストを clone する。リクエストは Stream なので
          // 一度しか処理できない。ここではキャッシュ用、fetch 用と2回
          // 必要なので、リクエストは clone しないといけない
          cache.put(e.request.url, response.clone());
          console.log('Service Worker-Completed dataCache');
          return response;
        });
      })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  }
});

// push通知
self.addEventListener('push', function(event) {
    const message = event.data ? event.data.text() : '(・∀・)';

    event.waitUntil(
      // A-2-2 メッセージングサーバーへ諸情報を送信
      // A-2-3 全ての情報が正式に認識されるとプッシュが表示される
      //       引数は、タイトルとコンテンツ
      self.registration.showNotification('プッシュ通知ですよ', {
          body: message,
          icon: './images/icons/icon-192x192.png',
          tag: 'push-notification-tag'
      })
    );
});

// Background Sync
// オフラインからオンラインに復帰した際に Service Workerがイベントを受け取ることができるから
self.addEventListener('sync', (e) => {
  console.info('sync', e);

  var key = 'A1';
  var dbVersion = 2;

  const storeName  = 'sampleStore',
        dbName = 'sampleDB';

  var openReq = indexedDB.open(dbName);

  // DBに接続
  var dbRequest = indexedDB.open(dbName, dbVersion);

  dbRequest.onsuccess = function(event){
      console.log('DBに接続されました。')
      var db = event.target.result;

      // userテーブルが読み書き可能であることを宣言している。
      var transaction = db.transaction(storeName);
      var store = transaction.objectStore(storeName);
      // userテーブルにデータを
      var result = store.get(key);
      result.onsuccess = function(event) {
        var data = event.target.result

        const message =  data.name;

        // A-2-2 メッセージングサーバーへ諸情報を送信
        // A-2-3 全ての情報が正式に認識されるとプッシュが表示される
        //       引数は、タイトルとコンテンツ
        self.registration.showNotification('Push通知ですよ', {
            body: message,
            icon: './images/icons/icon-192x192.png',
            vibrate: [500, 200, 500, 200, 500, 200, 500],
            actions: [{
              action: "act1",
              title: "ページAへ"
            }, {
              action: "act2",
              title: "ページBへ"
            }],
            tag: 'push-notification-tag'
        })

      };


      db.close();
  }
  dbRequest.onerror = function(event){
      console.log('DBの接続に失敗しました。');
  }

});

// push通知のアクション
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'act1') {
    clients.openWindow("/act1.html");
  } else if (event.action === 'act2') {
    clients.openWindow("/act2.html");
  } else {
    clients.openWindow("/");
  }
}, false);

