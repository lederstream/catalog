/* Notifications System */
.notifications-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
    max-width: 350px;
}

.notification {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: flex-start;
    animation: slideIn 0.3s ease-out;
    position: relative;
    overflow: hidden;
    border-left: 4px solid #4a90e2;
}

.notification.success {
    border-left-color: #10b981;
}

.notification.error {
    border-left-color: #ef4444;
}

.notification.warning {
    border-left-color: #f59e0b;
}

.notification.info {
    border-left-color: #3b82f6;
}

.notification-content {
    flex: 1;
    margin-right: 0.5rem;
}

.notification-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: #1f2937;
}

.notification-message {
    color: #4b5563;
    font-size: 0.875rem;
    line-height: 1.4;
}

.notification-close {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1;
    padding: 0;
    margin-left: 0.5rem;
}

.notification-close:hover {
    color: #6b7280;
}

.notification-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: rgba(0, 0, 0, 0.1);
    width: 100%;
    transform-origin: left;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.notification.hide {
    animation: slideOut 0.3s ease-in forwards;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .notifications-container {
        left: 1rem;
        right: 1rem;
        max-width: none;
    }
}
