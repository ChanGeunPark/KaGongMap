importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCbw0KApKx3CLuFsPq18qe6V5-E_VjBHV8",
  projectId: "kagongmap",
  messagingSenderId: "1045730662094",
  appId: "1:1045730662094:web:256c1ecc49354fd7f8a29f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message received:",
    payload,
  );

  const notificationTitle = payload.notification?.title || "알림";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/icons/icon-192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
