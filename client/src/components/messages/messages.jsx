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
            <div>
                <form className={styles.messageDiv}>
                    <label htmlFor="message" hidden></label>
                    <textarea name="message" id="message" placeholder='Send a message...'></textarea>
                    <button>Send Message</button>
                </form>
                <form className={styles.uploadDiv}>
                    <label htmlFor="image" hidden></label>
                    <input type="file" />
                    {/* <button>Send Image</button> */}
                </form>
            </div>
        </section>
    )
}