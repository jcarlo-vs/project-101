import * as Notifications from 'expo-notifications';
import type { Subscription, CreditCard } from '@/constants/theme';
import { formatCurrency } from './calculations';
import { getNextDueDate } from './credit-card-calculations';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function getReminderTitle(sub: Subscription): string {
  if (sub.reminderOffset === 0) return `${sub.name} renews today`;
  if (sub.reminderOffset === 1) return `${sub.name} renews tomorrow`;
  return `${sub.name} renews in ${sub.reminderOffset} days`;
}

export async function scheduleRenewalReminder(sub: Subscription): Promise<string | null> {
  if (sub.reminderOffset === -1 || !sub.active) return null;

  const billingDate = new Date(sub.nextBillingDate);
  const reminderDate = new Date(billingDate);
  reminderDate.setDate(reminderDate.getDate() - sub.reminderOffset);
  reminderDate.setHours(10, 0, 0, 0);

  // Don't schedule if the reminder date is in the past
  if (reminderDate.getTime() <= Date.now()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: getReminderTitle(sub),
      body: `Your ${sub.cycle} subscription of ${formatCurrency(sub.cost)} renews on ${sub.nextBillingDate}.`,
      data: { subscriptionId: sub.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate },
  });

  return id;
}

export async function cancelRenewalReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function scheduleDueDateReminder(card: CreditCard): Promise<string | null> {
  if (card.reminderOffset === -1 || !card.active) return null;

  const dueDate = getNextDueDate(card);
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - card.reminderOffset);
  reminderDate.setHours(10, 0, 0, 0);

  if (reminderDate.getTime() <= Date.now()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: card.reminderOffset === 0
        ? `${card.name} payment due today`
        : card.reminderOffset === 1
          ? `${card.name} payment due tomorrow`
          : `${card.name} payment due in ${card.reminderOffset} days`,
      body: `Minimum payment of ${formatCurrency(card.minimumPayment)} is due. Balance: ${formatCurrency(card.currentBalance)}.`,
      data: { creditCardId: card.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate },
  });

  return id;
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendTestNotification(): Promise<void> {
  const granted = await registerForPushNotifications();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Finvy is working!',
      body: 'Renewal reminders will appear just like this.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
    },
  });
}
