// SmartTask Service Worker
// Handles Web Push, background notification events, and notification action clicks

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push payload
self.addEventListener('push', (event) => {
  let data = {
    title: 'SmartTask Reminder',
    body: 'You have an upcoming task deadline.',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: 'smarttask-reminder',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/vite.svg',
    badge: data.badge || '/vite.svg',
    tag: data.tag || 'smarttask-' + Date.now(),
    data: data.data || { url: '/' },
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'view', title: '👁️ View Task' },
      { action: 'complete', title: '✅ Mark Complete' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click and action buttons
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const taskData = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and post message
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: action || 'view',
            taskId: taskData.taskId,
          });
          return;
        }
      }
      // If no window open, open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/?focusTaskId=' + (taskData.taskId || ''));
      }
    })
  );
});
