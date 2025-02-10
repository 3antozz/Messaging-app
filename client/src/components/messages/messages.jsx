import styles from './messages.module.css'
export default function Messages () {
    return (
        <section className={styles.messenger}>
            <div className={styles.info}>
                <h2>Receiver / Group Name</h2>
            </div>
            <div className={styles.main}>
                <p>message</p>
                <p>message</p>
                <p>message</p>
                <p>message</p>
                <p>message</p>
            </div>
            <form>
                <div className={styles.messageDiv}>
                    <label htmlFor="message" hidden></label>
                    <textarea name="message" id="message" placeholder='Send a message...'></textarea>
                </div>
                <div className={styles.uploadDiv}>
                    <label htmlFor="image" hidden></label>
                    <input type="file" />
                </div>
                <button>Send</button>
            </form>
        </section>
    )
}