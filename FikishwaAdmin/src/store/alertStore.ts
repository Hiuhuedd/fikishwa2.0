import { create } from 'zustand';

export type AlertType = 'success' | 'warning' | 'error' | 'info';

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    buttons: AlertButton[];
    showAlert: (title: string, message: string, type?: AlertType, buttons?: AlertButton[]) => void;
    showSuccess: (title: string, message: string, buttons?: AlertButton[]) => void;
    showWarning: (title: string, message: string, buttons?: AlertButton[]) => void;
    showError: (title: string, message: string, buttons?: AlertButton[]) => void;
    hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
    showAlert: (title, message, type = 'info', buttons = [{ text: 'OK' }]) => 
        set({ visible: true, title, message, type, buttons }),
    showSuccess: (title, message, buttons) => 
        set({ visible: true, title, message, type: 'success', buttons: buttons || [{ text: 'OK' }] }),
    showWarning: (title, message, buttons) => 
        set({ visible: true, title, message, type: 'warning', buttons: buttons || [{ text: 'OK' }] }),
    showError: (title, message, buttons) => 
        set({ visible: true, title, message, type: 'error', buttons: buttons || [{ text: 'OK' }] }),
    hideAlert: () => set({ visible: false })
}));
