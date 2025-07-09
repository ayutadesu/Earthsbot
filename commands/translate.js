const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const { translate } = require('@vitalets/google-translate-api');

module.exports = [
  {
    data: new ContextMenuCommandBuilder()
      .setName('Translate to English')
      .setNameLocalizations({
        'ja': '翻訳：英語',
        'zh-CN': '翻译：英语',
        'zh-TW': '翻譯：英語',
        'ko': '번역: 영어',
        'fr': 'Traduire en anglais',
        'de': 'Ins Englische übersetzen',
        'es-ES': 'Traducir al inglés',
        'pt-BR': 'Traduzir para inglês',
        'ru': 'Перевести на английский',
        'it': 'Traduci in inglese'
      })
      .setType(3), // ApplicationCommandType.Message
    async execute(interaction) {
      try {
        await interaction.deferReply();
        
        const textToTranslate = interaction.targetMessage.content;
        
        if (!textToTranslate || textToTranslate.trim() === '') {
          const errorMsg = interaction.locale === 'ja' ? '翻訳するテキストが見つかりません。' :
                          interaction.locale === 'zh-CN' ? '未找到要翻译的文本。' :
                          interaction.locale === 'zh-TW' ? '未找到要翻譯的文本。' :
                          interaction.locale === 'ko' ? '번역할 텍스트를 찾을 수 없습니다.' :
                          interaction.locale === 'fr' ? 'Aucun texte à traduire trouvé.' :
                          interaction.locale === 'de' ? 'Kein zu übersetzender Text gefunden.' :
                          interaction.locale === 'es-ES' ? 'No se encontró texto para traducir.' :
                          interaction.locale === 'pt-BR' ? 'Nenhum texto para traduzir encontrado.' :
                          interaction.locale === 'ru' ? 'Текст для перевода не найден.' :
                          interaction.locale === 'it' ? 'Nessun testo da tradurre trovato.' :
                          'No text to translate found.';
          await interaction.editReply(errorMsg);
          return;
        }
        
        const res = await translate(textToTranslate, { to: 'en' });
        const translatedText = res.text || 'Translation failed';
        
        const resultPrefix = interaction.locale === 'ja' ? '英語翻訳：' :
                            interaction.locale === 'zh-CN' ? '英语翻译：' :
                            interaction.locale === 'zh-TW' ? '英語翻譯：' :
                            interaction.locale === 'ko' ? '영어 번역:' :
                            interaction.locale === 'fr' ? 'Traduction anglaise :' :
                            interaction.locale === 'de' ? 'Englische Übersetzung:' :
                            interaction.locale === 'es-ES' ? 'Traducción al inglés:' :
                            interaction.locale === 'pt-BR' ? 'Tradução para inglês:' :
                            interaction.locale === 'ru' ? 'Английский перевод:' :
                            interaction.locale === 'it' ? 'Traduzione inglese:' :
                            'English Translation:';
        
        await interaction.editReply(`${resultPrefix}\n${translatedText}`);
      } catch (error) {
        console.error('Translation error:', error);
        const errorMsg = interaction.locale === 'ja' ? '翻訳中にエラーが発生しました。' :
                        interaction.locale === 'zh-CN' ? '翻译时发生错误。' :
                        interaction.locale === 'zh-TW' ? '翻譯時發生錯誤。' :
                        interaction.locale === 'ko' ? '번역 중 오류가 발생했습니다.' :
                        interaction.locale === 'fr' ? 'Une erreur s\'est produite lors de la traduction.' :
                        interaction.locale === 'de' ? 'Bei der Übersetzung ist ein Fehler aufgetreten.' :
                        interaction.locale === 'es-ES' ? 'Se produjo un error durante la traducción.' :
                        interaction.locale === 'pt-BR' ? 'Ocorreu um erro durante a tradução.' :
                        interaction.locale === 'ru' ? 'Произошла ошибка при переводе.' :
                        interaction.locale === 'it' ? 'Si è verificato un errore durante la traduzione.' :
                        'An error occurred during translation.';
        await interaction.editReply(errorMsg);
      }
    },
  },
  {
    data: new ContextMenuCommandBuilder()
      .setName('Translate to Chinese')
      .setNameLocalizations({
        'ja': '翻訳：中国語',
        'zh-CN': '翻译：中文',
        'zh-TW': '翻譯：中文',
        'ko': '번역: 중국어',
        'fr': 'Traduire en chinois',
        'de': 'Ins Chinesische übersetzen',
        'es-ES': 'Traducir al chino',
        'pt-BR': 'Traduzir para chinês',
        'ru': 'Перевести на китайский',
        'it': 'Traduci in cinese'
      })
      .setType(3), // ApplicationCommandType.Message
    async execute(interaction) {
      try {
        await interaction.deferReply();
        
        const textToTranslate = interaction.targetMessage.content;
        
        if (!textToTranslate || textToTranslate.trim() === '') {
          const errorMsg = interaction.locale === 'ja' ? '翻訳するテキストが見つかりません。' :
                          interaction.locale === 'zh-CN' ? '未找到要翻译的文本。' :
                          interaction.locale === 'zh-TW' ? '未找到要翻譯的文本。' :
                          interaction.locale === 'ko' ? '번역할 텍스트를 찾을 수 없습니다.' :
                          interaction.locale === 'fr' ? 'Aucun texte à traduire trouvé.' :
                          interaction.locale === 'de' ? 'Kein zu übersetzender Text gefunden.' :
                          interaction.locale === 'es-ES' ? 'No se encontró texto para traducir.' :
                          interaction.locale === 'pt-BR' ? 'Nenhum texto para traduzir encontrado.' :
                          interaction.locale === 'ru' ? 'Текст для перевода не найден.' :
                          interaction.locale === 'it' ? 'Nessun testo da tradurre trovato.' :
                          'No text to translate found.';
          await interaction.editReply(errorMsg);
          return;
        }
        
        const res = await translate(textToTranslate, { to: 'zh-CN' });
        const translatedText = res.text || 'Translation failed';
        
        const resultPrefix = interaction.locale === 'ja' ? '中国語翻訳：' :
                            interaction.locale === 'zh-CN' ? '中文翻译：' :
                            interaction.locale === 'zh-TW' ? '中文翻譯：' :
                            interaction.locale === 'ko' ? '중국어 번역:' :
                            interaction.locale === 'fr' ? 'Traduction chinoise :' :
                            interaction.locale === 'de' ? 'Chinesische Übersetzung:' :
                            interaction.locale === 'es-ES' ? 'Traducción al chino:' :
                            interaction.locale === 'pt-BR' ? 'Tradução para chinês:' :
                            interaction.locale === 'ru' ? 'Китайский перевод:' :
                            interaction.locale === 'it' ? 'Traduzione cinese:' :
                            'Chinese Translation:';
        
        await interaction.editReply(`${resultPrefix}\n${translatedText}`);
      } catch (error) {
        console.error('Translation error:', error);
        const errorMsg = interaction.locale === 'ja' ? '翻訳中にエラーが発生しました。' :
                        interaction.locale === 'zh-CN' ? '翻译时发生错误。' :
                        interaction.locale === 'zh-TW' ? '翻譯時發生錯誤。' :
                        interaction.locale === 'ko' ? '번역 중 오류가 발생했습니다.' :
                        interaction.locale === 'fr' ? 'Une erreur s\'est produite lors de la traduction.' :
                        interaction.locale === 'de' ? 'Bei der Übersetzung ist ein Fehler aufgetreten.' :
                        interaction.locale === 'es-ES' ? 'Se produjo un error durante la traducción.' :
                        interaction.locale === 'pt-BR' ? 'Ocorreu um erro durante a tradução.' :
                        interaction.locale === 'ru' ? 'Произошла ошибка при переводе.' :
                        interaction.locale === 'it' ? 'Si è verificato un errore durante la traduzione.' :
                        'An error occurred during translation.';
        await interaction.editReply(errorMsg);
      }
    },
  },
  {
    data: new ContextMenuCommandBuilder()
      .setName('Translate to Japanese')
      .setNameLocalizations({
        'ja': '翻訳：日本語',
        'zh-CN': '翻译：日语',
        'zh-TW': '翻譯：日語',
        'ko': '번역: 일본어',
        'fr': 'Traduire en japonais',
        'de': 'Ins Japanische übersetzen',
        'es-ES': 'Traducir al japonés',
        'pt-BR': 'Traduzir para japonês',
        'ru': 'Перевести на японский',
        'it': 'Traduci in giapponese'
      })
      .setType(3), // ApplicationCommandType.Message
    async execute(interaction) {
      try {
        await interaction.deferReply();
        
        const textToTranslate = interaction.targetMessage.content;
        
        if (!textToTranslate || textToTranslate.trim() === '') {
          const errorMsg = interaction.locale === 'ja' ? '翻訳するテキストが見つかりません。' :
                          interaction.locale === 'zh-CN' ? '未找到要翻译的文本。' :
                          interaction.locale === 'zh-TW' ? '未找到要翻譯的文本。' :
                          interaction.locale === 'ko' ? '번역할 텍스트를 찾을 수 없습니다.' :
                          interaction.locale === 'fr' ? 'Aucun texte à traduire trouvé.' :
                          interaction.locale === 'de' ? 'Kein zu übersetzender Text gefunden.' :
                          interaction.locale === 'es-ES' ? 'No se encontró texto para traducir.' :
                          interaction.locale === 'pt-BR' ? 'Nenhum texto para traduzir encontrado.' :
                          interaction.locale === 'ru' ? 'Текст для перевода не найден.' :
                          interaction.locale === 'it' ? 'Nessun testo da tradurre trovato.' :
                          'No text to translate found.';
          await interaction.editReply(errorMsg);
          return;
        }
        
        const res = await translate(textToTranslate, { to: 'ja' });
        const translatedText = res.text || 'Translation failed';
        
        const resultPrefix = interaction.locale === 'ja' ? '日本語翻訳：' :
                            interaction.locale === 'zh-CN' ? '日语翻译：' :
                            interaction.locale === 'zh-TW' ? '日語翻譯：' :
                            interaction.locale === 'ko' ? '일본어 번역:' :
                            interaction.locale === 'fr' ? 'Traduction japonaise :' :
                            interaction.locale === 'de' ? 'Japanische Übersetzung:' :
                            interaction.locale === 'es-ES' ? 'Traducción al japonés:' :
                            interaction.locale === 'pt-BR' ? 'Tradução para japonês:' :
                            interaction.locale === 'ru' ? 'Японский перевод:' :
                            interaction.locale === 'it' ? 'Traduzione giapponese:' :
                            'Japanese Translation:';
        
        await interaction.editReply(`${resultPrefix}\n${translatedText}`);
      } catch (error) {
        console.error('Translation error:', error);
        const errorMsg = interaction.locale === 'ja' ? '翻訳中にエラーが発生しました。' :
                        interaction.locale === 'zh-CN' ? '翻译时发生错误。' :
                        interaction.locale === 'zh-TW' ? '翻譯時發生錯誤。' :
                        interaction.locale === 'ko' ? '번역 중 오류가 발생했습니다.' :
                        interaction.locale === 'fr' ? 'Une erreur s\'est produite lors de la traduction.' :
                        interaction.locale === 'de' ? 'Bei der Übersetzung ist ein Fehler aufgetreten.' :
                        interaction.locale === 'es-ES' ? 'Se produjo un error durante la traducción.' :
                        interaction.locale === 'pt-BR' ? 'Ocorreu um erro durante a tradução.' :
                        interaction.locale === 'ru' ? 'Произошла ошибка при переводе.' :
                        interaction.locale === 'it' ? 'Si è verificato un errore durante la traduzione.' :
                        'An error occurred during translation.';
        await interaction.editReply(errorMsg);
      }
    },
  },
];