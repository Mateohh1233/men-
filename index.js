// filepath: d:\kitbox bot\index.js
require('dotenv').config(); // Betölti a .env fájl tartalmát

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, REST, Routes } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // Add hozzá a botod Client ID-ját a .env fájlhoz
const staffId = '1337722446085619733'; // Staff ID, aki mindig hozzáfér a jegyekhez

// Slash parancs regisztrálása
const commands = [
    {
        name: 'setup-ticket',
        description: 'Jegyrendszer üzenet létrehozása',
    },
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Slash parancsok regisztrálása...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Slash parancsok sikeresen regisztrálva!');
    } catch (error) {
        console.error('Hiba a slash parancsok regisztrálásakor:', error);
    }
})();

// Bot készenléti állapot
client.once('ready', () => {
    console.log(`Bejelentkezve mint ${client.user.tag}!`);
});

// Jegyrendszer üzenet létrehozása gombokkal
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'setup-ticket') {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('<:ticket:1363199539061981497> **Nyiss egy Jegyet!**')
            .setDescription(
                '<:ticket:1363199539061981497> **Jegy nyitása**\n\n' +
                '<:member:1260184113806180436> **Egyéb** - Ha valami más problémád van vagy segítségre szorulsz.\n' +
                '<:moderator:1260184256945066004> **Hiba** - Ha hibát vagy bugot szeretnél jelenteni.\n' +
                '<a:piroskorona:1177256524293345381> **Fellebbezés** - Ha ki lettél bannolva és fellebbezni szeretnél.'
            )
            .setImage('https://files.catbox.moe/k819s2.png') // Cseréld ki a saját képed URL-jére
            .setFooter({ text: 'Powered by KitBox', iconURL: 'https://files.catbox.moe/k819s2.png' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket-other')
                    .setLabel('Egyéb')
                    .setEmoji('<:member:1260184113806180436>') // Egyedi emotikon
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket-bug')
                    .setLabel('Hiba')
                    .setEmoji('<:moderator:1260184256945066004>') // Egyedi emotikon
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('ticket-appeal')
                    .setLabel('Fellebbezés')
                    .setEmoji('<a:piroskorona:1177256524293345381>') // Animált emotikon
                    .setStyle(ButtonStyle.Success),
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
});

// Jegy létrehozása gombok alapján
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const guild = interaction.guild;
    const user = interaction.user;

    let categoryName;
    if (interaction.customId === 'ticket-other') categoryName = 'Egyéb';
    if (interaction.customId === 'ticket-bug') categoryName = 'Hiba';
    if (interaction.customId === 'ticket-appeal') categoryName = 'Fellebbezés';

    if (!categoryName) return;

    const categoryIcons = {
        'Egyéb': '<:member:1260184113806180436>',
        'Hiba': '<:moderator:1260184256945066004>',
        'Fellebbezés': '<a:piroskorona:1177256524293345381>',
    };

    // Jegy csatorna létrehozása
    const channel = await guild.channels.create({
        name: `jegy-${user.username}`,
        type: 0, // Szöveges csatorna
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionsBitField.Flags.ViewChannel], // Mindenki elől elrejtve
            },
            {
                id: user.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages], // Felhasználónak engedélyezve
            },
            {
                id: staffId, // Staff ID hozzáférése
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
        ],
    });

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`${categoryIcons[categoryName]} **Hibajegy létrehozva!**`)
        .setDescription(
            `🎉 **Köszönjük, hogy felvetted velünk a kapcsolatot!** 🎉\n\n` +
            `🔔 **Egy csapattag hamarosan válaszol.** Max **2 Staff Ping** lehet.\n\n` +
            `📋 **Kérjük, részletezd a problémád, hogy gyorsabban segíthessünk.**\n\n` +
            `**Kategória:** ${categoryIcons[categoryName]} **${categoryName}**\n\n` +
            `📝 **__Töltsd ki az alábbi információkat!__**\n` +
            '`🎮 MC Felhasználó neved:`\n' +
            '`💬 DC felhasználónév:`\n' +
            '`❓ Miért nyitottál jegyet:`'
        )
        .setFooter({ text: 'KitBox Support', iconURL: 'https://files.catbox.moe/k819s2.png' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('claim-ticket')
                .setLabel('Elvállal')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('close-ticket')
                .setLabel('Zárás')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('update-status')
                .setLabel('Státusz frissítése')
                .setStyle(ButtonStyle.Secondary),
        );

    await channel.send({ content: `Üdv, ${user}! Ez a jegyed.`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `Jegy létrehozva a(z) **${categoryName}** kategóriában!`, ephemeral: true });

    setTimeout(async () => {
        if (!channel.deleted) {
            await channel.send('🔔 **Emlékeztető:** A jegy még mindig nyitva van. Kérjük, frissítsd a státuszt vagy zárd le.');
        }
    }, 3600000); // 1 óra
});

// Jegy elvállalása, zárása és státusz frissítése
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const channel = interaction.channel;

    if (interaction.customId === 'claim-ticket') {
        const member = interaction.member;

        await channel.permissionOverwrites.edit(member, {
            ViewChannel: true,
            SendMessages: true,
        });

        await interaction.reply({ content: `A jegyet elvállalta: ${member}.`, ephemeral: false });
    }

    if (interaction.customId === 'close-ticket') {
        await interaction.reply({ content: 'A jegy lezárásra került.', ephemeral: false });
        await channel.delete();
    }

    if (interaction.customId === 'update-status') {
        // Kérdezd meg a felhasználót az új státuszról
        await interaction.reply({
            content: 'Kérlek, írd be az új státuszt (pl. "Folyamatban", "Megoldva", stb.):',
            ephemeral: true, // Csak a felhasználó látja
        });

        // Várj a felhasználó válaszára
        const filter = (msg) => msg.author.id === interaction.user.id;
        const collector = channel.createMessageCollector({ filter, time: 60000, max: 1 });

        collector.on('collect', async (msg) => {
            const newStatus = msg.content;

            // Keressük meg a jegy üzenetét
            const messages = await channel.messages.fetch({ limit: 50 }); // Az utolsó 50 üzenet lekérése
            const ticketMessage = messages.find((m) => m.embeds.length > 0 && m.embeds[0].title.includes('Hibajegy létrehozva!'));

            if (ticketMessage) {
                const embed = ticketMessage.embeds[0];
                const updatedEmbed = EmbedBuilder.from(embed)
                    .setFields(
                        ...embed.fields.filter((field) => field.name !== 'Státusz'), // Töröljük a régi státuszt
                        { name: 'Státusz', value: `**${newStatus}**`, inline: true } // Hozzáadjuk az új státuszt
                    );

                await ticketMessage.edit({ embeds: [updatedEmbed] });
                await msg.reply({ content: `A státusz frissítve lett: **${newStatus}**`, ephemeral: true });
            } else {
                await msg.reply({ content: 'Nem található a jegy üzenete, a státusz nem lett frissítve.', ephemeral: true });
            }
        });

        collector.on('end', (collected) => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'Nem érkezett válasz, a státusz nem lett frissítve.', ephemeral: true });
            }
        });
    }
});

client.login(TOKEN);