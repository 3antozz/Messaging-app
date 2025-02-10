import styles from './layout.module.css'
import { Outlet } from 'react-router'

export default function AuthLayout () {
    return (
        <section className={styles.container}>
            <Outlet />
        </section>
    )
}