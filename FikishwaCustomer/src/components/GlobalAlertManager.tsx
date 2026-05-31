import React from 'react';
import { useAlertStore } from '../store/alertStore';
import PremiumAlert from './PremiumAlert';

const GlobalAlertManager = () => {
    const { visible, title, message, type, buttons, hideAlert } = useAlertStore();

    if (!visible) return null;

    return (
        <PremiumAlert
            visible={visible}
            title={title}
            message={message}
            type={type}
            buttons={
                buttons.length > 0 
                    ? buttons.map(b => ({
                        ...b,
                        onPress: () => {
                            if (b.onPress) b.onPress();
                            hideAlert();
                        }
                    }))
                    : [{ text: 'OK', onPress: hideAlert }]
            }
        />
    );
};

export default GlobalAlertManager;
