import { useEffect, useState } from "react";
import styles from "./popup.module.css"
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

export default function Popup ({children, shouldRender, close}) {
    const [isVisible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false)
    const closePopup = () => {
        if(!shouldRender) {
            setVisible(false)
            close(false)
        }
    }
    useEffect(() => {
        if(shouldRender) {
            setVisible(true)
            setExiting(false)
        }
        if(!shouldRender && isVisible) {
            setExiting(true)
        }
    }, [shouldRender, isVisible])
    return (
        <>
        {isVisible &&
            <section className={!exiting ? `${styles.container} ${styles.visible}` : `${styles.container} ${styles.exit}` } onAnimationEnd={closePopup}>
                {children}
                <button onClick={() => setExiting(true)}><X size={15} /></button>
            </section>
        }
        </>
    )
}


Popup.propTypes = {
    children: PropTypes.element,
    shouldRender: PropTypes.bool,
    close: PropTypes.func,
}