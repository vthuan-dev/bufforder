import i18n from '../i18n';

interface Notification {
  title: string;
  message: string;
}

export function translateNotification(notification: Notification): Notification {
  const { t } = i18n;
  let translatedTitle = notification.title;
  let translatedMessage = notification.message;

  // Translate title based on common patterns
  if (notification.title === 'Balance Adjusted') {
    translatedTitle = t('my:notifications.types.balanceAdjusted');
  } else if (notification.title === 'Deposit Approved') {
    translatedTitle = t('my:notifications.types.depositApproved');
  } else if (notification.title === 'Withdrawal Approved') {
    translatedTitle = t('my:notifications.types.withdrawalApproved');
  } else if (notification.title === 'Withdrawal Rejected') {
    translatedTitle = t('my:notifications.types.withdrawalRejected');
  } else if (notification.title === 'Order Completed') {
    translatedTitle = t('my:notifications.types.orderCompleted');
  } else if (notification.title === 'Commission Earned') {
    translatedTitle = t('my:notifications.types.commissionEarned');
  } else if (notification.title === 'VIP Level Upgraded!') {
    translatedTitle = t('my:notifications.types.vipUpgraded');
  }

  // Translate message based on patterns
  // Pattern: "Congratulations! Your account has been upgraded to X."
  const vipMatch = notification.message.match(/Congratulations! Your account has been upgraded to ([^\.]+)\./);
  if (vipMatch) {
    translatedMessage = t('my:notifications.messages.vipUpgraded', { level: vipMatch[1] });
  }

  // Pattern: "Admin has deducted X from your account."
  const deductedMatch = notification.message.match(/Admin has deducted ([\d,.$]+) from your account\./);
  if (deductedMatch) {
    translatedMessage = t('my:notifications.messages.adminDeducted', { amount: deductedMatch[1] });
  }

  // Pattern: "Admin has added X to your account."
  const addedMatch = notification.message.match(/Admin has added ([\d,.$]+) to your account\./);
  if (addedMatch) {
    translatedMessage = t('my:notifications.messages.adminAdded', { amount: addedMatch[1] });
  }

  // Pattern: "Your deposit of $X has been approved."
  const depositMatch = notification.message.match(/Your deposit of ([\d,.$]+) has been approved\./);
  if (depositMatch) {
    translatedMessage = t('my:notifications.messages.depositApproved', { amount: depositMatch[1] });
  }

  // Pattern: "Your withdrawal of $X has been approved."
  const withdrawalApprovedMatch = notification.message.match(/Your withdrawal of ([\d,.$]+) has been approved\./);
  if (withdrawalApprovedMatch) {
    translatedMessage = t('my:notifications.messages.withdrawalApproved', { amount: withdrawalApprovedMatch[1] });
  }

  // Pattern: "Your withdrawal of $X has been rejected."
  const withdrawalRejectedMatch = notification.message.match(/Your withdrawal of ([\d,.$]+) has been rejected\./);
  if (withdrawalRejectedMatch) {
    translatedMessage = t('my:notifications.messages.withdrawalRejected', { amount: withdrawalRejectedMatch[1] });
  }

  return {
    title: translatedTitle,
    message: translatedMessage
  };
}
