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


// async function everyone () {
//     const users = await prisma.user.findMany();
//     for(const user of users) {
//         await prisma.user.update({
//             where: {
//                 id: user.id
//             },
//             data: {
//                 conversations: {
//                     connect: {
//                         identifier: "public_group",
//                     }
//                 }
//             }
//         })
//     }
// }

// everyone();
