(function() {

  const app = {
    isLoading: true,
    visibleCards: {},
    visibleSelects: {},
    selectedPlayers: [],
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    selectTemplate: document.querySelector('.selectTemplate'),
    container: document.querySelector('.main'),
    selectContainer: document.querySelector('.selectContainer'),
    addDialog: document.querySelector('.dialog-container')
  };

  const INDEX_ZERO = "0";

  document.getElementById('butAdd').addEventListener('click', function() {
    app.toggleAddDialog(true);
  });

  document.getElementById('butAddPlayer').addEventListener('click', function() {
    const select = document.getElementById('selectPlayerToAdd'),
          selected = select.options[select.selectedIndex],
          id = selected.value,
          name = selected.textContent;
    if (!app.selectedPlayers) {
      app.selectedPlayers = [];
    }
    app.getPlayers(id, name);
    app.selectedPlayers.push({id: id, name: name});
    app.saveselectedPlayers();
    app.toggleAddDialog(false);
  });

  document.getElementById('butAddCancel').addEventListener('click', function() {
    app.toggleAddDialog(false);
  });

  document.getElementById('message').addEventListener('input', function() {
    if (document.getElementById('message').value){
      document.getElementById('button').disabled = false;
    }else{
      document.getElementById('button').disabled = true;
    }
  });

  app.toggleAddDialog = function(visible) {
    if (visible) {
      app.addDialog.classList.add('dialog-container--visible');
    } else {
      app.addDialog.classList.remove('dialog-container--visible');
    }
  };

  app.updatePlayerCard = function(data) {
    const name = data.name,
          nationality = data.nationality,
          dob = data.dob,
          position = data.position;

    let card = app.visibleCards[data.id];
    if (!card) {
      card = app.cardTemplate.cloneNode(true);
      card.classList.remove('cardTemplate');
      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.visibleCards[data.id] = card;
    }

    card.querySelector('.name').textContent = name;
    card.querySelector('.nationality').textContent = nationality;
    card.querySelector('.dob').textContent = dob;
    card.querySelector('.position').textContent = position;

    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };

  app.updatePlayerSelect = function(datas) {
    datas.forEach( function(player) {
      const name = player.gsx$name.$t,
            id = player.gsx$id.$t;
      let select = app.visibleSelects[id];
      if (!select) {
        select = app.selectTemplate.cloneNode(true);
        select.classList.remove('selectTemplate');
        select.removeAttribute('hidden');
        app.selectContainer.insertBefore(select, app.selectTemplate);
        app.visibleSelects[id] = select;
      }
      select.textContent = name;
      select.value = id;
      if (id === INDEX_ZERO) {
        select.selected = true;
      }
    })
  };

  app.setPlayerSelect = function() {
    const url = 'https://spreadsheets.google.com/feeds/list/12jXEVD4-zvfF3puYm5Xl0TW6MM8qQ51l0dz3HjCaKHI/od6/public/values?alt=json';
    const request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          const response = JSON.parse(request.response),
                results = response.feed.entry;
          app.updatePlayerSelect(results);
        }
      }
    };
    request.open('GET', url);
    request.send();
  };

  app.getPlayers = function(id, name) {
    const url = 'https://spreadsheets.google.com/feeds/list/12jXEVD4-zvfF3puYm5Xl0TW6MM8qQ51l0dz3HjCaKHI/od6/public/values?alt=json';
    if ('caches' in window) {
      caches.match(url).then(function(response) {
        if (response) {
          response.json().then(function updateFromCache(json) {
            const result = json.feed.entry[+id],
                  results = json.feed.entry;
            result.id = result.gsx$id.$t;
            result.name = result.gsx$name.$t;
            result.dob = result.gsx$dob.$t;
            result.nationality = result.gsx$nationality.$t;
            result.position = result.gsx$position.$t;
            app.updatePlayerCard(result);
            app.updatePlayerSelect(results);
          });
        }
      });
    }
    const request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          const response = JSON.parse(request.response),
                result = response.feed.entry[+id],
                results = response.feed.entry;
          result.id = result.gsx$id.$t;
          result.name = result.gsx$name.$t;
          result.dob = result.gsx$dob.$t;
          result.nationality = result.gsx$nationality.$t;
          result.position = result.gsx$position.$t;
          app.updatePlayerCard(result);
          app.updatePlayerSelect(results);
        }
      } else {
        app.updatePlayerCard(initialPlayer);
      }
    };
    request.open('GET', url);
    request.send();
  };

  app.saveselectedPlayers = function() {
    const selectedPlayers = JSON.stringify(app.selectedPlayers);
    localStorage.selectedPlayers = selectedPlayers;
  };

  const initialPlayer = {
    id: '2',
    name: 'Lionel Messi',
    nationality: 'Argentina',
    dob: '24 June 1987',
    position: 'Forward'
  };

  app.selectedPlayers = localStorage.selectedPlayers;
  if (app.selectedPlayers) {
    app.selectedPlayers = JSON.parse(app.selectedPlayers);
    app.selectedPlayers.forEach(function(player) {
      app.getPlayers(player.id, player.name);
    });
  } else {
    app.updatePlayerCard(initialPlayer);
    app.selectedPlayers = [
      {id: initialPlayer.id, name: initialPlayer.name}
    ];
    app.setPlayerSelect();
    app.saveselectedPlayers();
  }

  if ('serviceWorker' in navigator) {

    let endpoint = document.querySelector('#subscription-endpoint'),
        key = document.querySelector('#subscription-public-key'),
        auth = document.querySelector('#subscription-auth')
        result = $('#result');

    // register しただけでは、servicewokerをコントローラーとして使えない
    // register して、controllerchangeイベントの時に、コントローラーとして使えるようにしている
    // →　service workerが初めてregisterの時のみ。つまり、最初のみ。
    let controllerChange = new Promise((resolve, reject) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        resolve(navigator.serviceWorker.controller);
      });
    });

    // service worker の登録
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() {
                console.log('ServiceWorker Registered!');

                var deferredPrompt;
                // ユーザーへのホーム画面への追加通知を保留
                window.addEventListener('beforeinstallprompt', function(e) {
                  result.val('beforeinstallprompt Event fired');
                  e.preventDefault();

                  // Stash the event so it can be triggered later.
                  deferredPrompt = e;

                  document.getElementById('save').disabled = "";

                  return false;
                });

                // ユーザーの任意のタイミングでホーム画面への追加通知を表示
                document.getElementById('save').addEventListener('click', function() {
                  if(deferredPrompt !== undefined) {
                    // The user has had a postive interaction with our app and Chrome
                    // has tried to prompt previously, so let's show the prompt.
                    deferredPrompt.prompt();

                    // Follow what the user has done with the prompt.
                    deferredPrompt.userChoice.then(function(choiceResult) {

                      console.log(choiceResult.outcome);

                      if(choiceResult.outcome == 'dismissed') {
                        result.val('User cancelled home screen install');
                      }
                      else {
                        result.val('User added to home screen');
                      }

                      // We no longer need the prompt.Clear it up.
                      deferredPrompt = null;

                      document.getElementById('save').disabled = "true";
                    });
                  }else{
                    console.log('test');
                  }
                });
              });
    navigator.serviceWorker.ready
             .then((registration) => {

                // 新しいservice workerになった時に
                registration.addEventListener('updatefound', (e) => {
                  console.info('updatefound', e);
                });

                console.log('serviceWorker.ready');
                if(navigator.serviceWorker.controller) {
                  console.log('controller', navigator.serviceWorker.controller);
                }else{
                  // service workerがregisterされた時は、ここの値はnull
                  // 一度、service workerがregisterされてコントローラーになった後の時は、コントローラー名が表示される
                  console.log('controller', controllerChange);
                }

                document.getElementById('button').addEventListener('click', () => {

                      const message = document.getElementById('message').value,
                            storeName  = 'sampleStore',
                            dbName = 'sampleDB',
                            openReq = indexedDB.open(dbName, 2);

                      let   data = {id : 'A1', name : message};

                      // 新規作成時とか更新時
                      openReq.onupgradeneeded = function(event){
                          console.log('DBが新たに作成されました。DB名 : ' + dbName);

                          var db = event.target.result;
                          // 新規作成テーブルがあれば作成する
                          if(storeName){
                              db.createObjectStore(storeName, {keyPath : 'id'})
                          }
                      }

                      openReq.onsuccess = function(event){
                        console.log('DBに接続されました。DB名 : ' + dbName)
                        var db = event.target.result;
                        var trans = db.transaction(storeName, 'readwrite');
                        var store = trans.objectStore(storeName);
                        var putReq = store.put(data);

                        putReq.onsuccess = function(){
                          console.log('put data success');
                        }

                        trans.oncomplete = function(){
                        // トランザクション完了時(putReq.onsuccessの後)に実行
                          console.log('transaction complete');
                        }

                        db.close();
                      }

                      openReq.onerror = function(event){
                          console.log('DBの接続に失敗しました。');
                      }


                      registration.sync.register('sync-test')
                                  .then(() => {
                                     console.log('sync registerd');
                                  })
                                  .catch(console.error.bind(console));
                 }, false);
                // A プッシュ通知
                // A-1 登録が完了するまでの準備段階
                // A-1-1 ユーザーにプッシュ通知の許可ダイアログを表示する
                // A-1-2 ユーザーによってプッシュ通知の送信が許可されたら、メッセージングサービスへの送信を行う
                //       userVisibleOnly : プッシュが送信されるたびに通知を表示するか否か
                //       applicationServerKey : 公開鍵を渡す。
                return registration.pushManager.subscribe({userVisibleOnly: true});
             })
             // A-1-3 メッセージングサービスからのレスポンス
             //     Push Subscriptionオブジェクトが返される
             // A-1-4 keyやendpointを表示する(本来はここでデータベースに保存しておくことで、一度プッシュ通知を許可したユーザーに対して、何度もプッシュ通知を送ることができる。)
             .then((subscription) => {
                 var rawKey = subscription.getKey ? subscription.getKey('p256dh') : '';
                 key.value = rawKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) : '';

                 var rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : '';
                 auth.value = rawAuthSecret ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) : '';

                 endpoint.value = subscription.endpoint;
                 console.log(`GCM EndPoint is: ${subscription.endpoint}`);
             })
             .catch(console.error.bind(console));

  }
})();
