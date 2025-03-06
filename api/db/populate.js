const prisma = require('./client');


(async function createPublicGroup () {
    await prisma.conversation.upsert({
        where: { identifier: "public_group" },
        update: {},
        create: {
            group_name: "Public Chat",
            isPublic: true,
            identifier: "public_group",
            isGroup: true
        }
    });
    return;
})();
