sendTo('telegram.0',{
    text: 'Bitte wähle einen Button',
    reply_markup: {
        keyboard: [
            ['Weihnachten An', 'Weihnachten Aus'],
            ['Büro An', 'Büro Aus'],
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    }
})
