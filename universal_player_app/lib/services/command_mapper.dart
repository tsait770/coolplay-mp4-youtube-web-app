enum Cmd {
  play, pause, stop, next, previous, replay,
  fwd10, fwd20, fwd30, back10, back20, back30,
  volMax, mute, unmute, volUp, volDown,
  enterFullscreen, exitFullscreen,
  speed05, speed10, speed125, speed15, speed20,
}

class CommandMapper {
  Cmd? map(String text) {
    final t = text.trim().toLowerCase();
    // Lexicon per language (synonyms/variants)
    final Map<Cmd, List<String>> lex = {
      Cmd.play: ['play', 'start', 'go', '播放', '开始', '再生', '재생', 'lecture', 'reproducir', 'spielen', 'reproduzir', 'riprodurre', 'играть', 'चलाओ', 'تشغيل'],
      Cmd.pause: ['pause', '暫停', '暂停', '一時停止', '일시 정지', 'pause fr', 'pausa', 'pausar', 'pausa it', 'пауза', 'रोक', 'إيقاف مؤقت'],
      Cmd.stop: ['stop', '停止', '停止 日', '정지', 'arrêter', 'detener', 'stopp', 'parar', 'fermare', 'стоп', 'रुको', 'إيقاف'],
      Cmd.next: ['next', '下一', '次へ', '다음', 'suivant', 'siguiente', 'weiter', 'próximo', 'prossimo', 'следующий', 'आगे', 'التالي'],
      Cmd.previous: ['previous', '上一', '前へ', '이전', 'précédent', 'anterior', 'zurück', 'anterior pt', 'precedente', 'предыдущий', 'पीछे', 'السابق'],
      Cmd.replay: ['replay', 'restart', '從頭', '从头', '最初から', '처음부터', 'redémarrer', 'reiniciar', 'neu starten', 'reiniciar pt', 'riavvia', 'перезапуск', 'फिर से', 'إعادة'],
      Cmd.fwd30: ['forward 30', '快轉 30', '快进 30', '30秒進む', '30초 앞으로', 'avancer 30', 'adelantar 30', '30 vor', 'adiantar 30', 'avanti 30', 'вперёд 30', 'आगे 30', 'تقديم 30'],
      Cmd.fwd20: ['forward 20', '快轉 20', '快进 20', '20秒進む', '20초 앞으로', 'avancer 20', 'adelantar 20', '20 vor', 'adiantar 20', 'avanti 20', 'вперёд 20', 'आगे 20', 'تقديم 20'],
      Cmd.fwd10: ['forward 10', '快轉 10', '快进 10', '10秒進む', '10초 앞으로', 'avancer 10', 'adelantar 10', '10 vor', 'adiantar 10', 'avanti 10', 'вперёд 10', 'आगे 10', 'تقديم 10'],
      Cmd.back30: ['rewind 30', 'back 30', '倒轉 30', '后退 30', '30秒戻る', '30초 뒤로', 'reculer 30', 'atras 30', '30 zurück', 'retroceder 30', 'indietro 30', 'назад 30', 'पीछे 30', 'ترجيع 30'],
      Cmd.back20: ['rewind 20', 'back 20', '倒轉 20', '后退 20', '20秒戻る', '20초 뒤로', 'reculer 20', 'atras 20', '20 zurück', 'retroceder 20', 'indietro 20', 'назад 20', 'पीछे 20', 'ترجيع 20'],
      Cmd.back10: ['rewind 10', 'back 10', '倒轉 10', '后退 10', '10秒戻る', '10초 뒤로', 'reculer 10', 'atras 10', '10 zurück', 'retroceder 10', 'indietro 10', 'назад 10', 'पीछे 10', 'ترجيع 10'],
      Cmd.volMax: ['max volume', '音量最大', '最大音量', '音量最大 日', '최대 볼륨', 'volume max', 'volumen máximo', 'maximale lautstärke', 'volume máximo', 'volume massimo', 'макс громкость', 'अधिकतम ध्वनि', 'أعلى صوت'],
      Cmd.mute: ['mute', '靜音', '静音', 'ミュート', '음소거', 'muet', 'silencio', 'stumm', 'mudo', 'muto', 'без звука', 'मौन', 'كتم'],
      Cmd.unmute: ['unmute', '解除靜音', '取消静音', 'ミュート解除', '음소거 해제', 'rétablir', 'activar sonido', 'stummschaltung aus', 'ativar som', 'riattiva audio', 'включить звук', 'आवाज चालू', 'إلغاء كتم'],
      Cmd.volUp: ['volume up', '音量調高', '调高音量', '音量を上げる', '볼륨 올려', 'augmenter volume', 'subir volumen', 'lauter', 'aumentar volume', 'alza volume', 'громче', 'आवाज बढ़ाओ', 'ارفع الصوت'],
      Cmd.volDown: ['volume down', '音量調低', '调低音量', '音量を下げる', '볼륨 내려', 'diminuer volume', 'bajar volumen', 'leiser', 'diminuir volume', 'abbassa volume', 'тише', 'आवाज घटाओ', 'اخفض الصوت'],
      Cmd.enterFullscreen: ['enter fullscreen', '進入全螢幕', '进入全屏', '全画面', '전체화면', 'plein écran', 'pantalla completa', 'vollbild', 'tela cheia', 'schermo intero', 'полный экран', 'फुल स्क्रीन', 'ملء الشاشة'],
      Cmd.exitFullscreen: ['exit fullscreen', '離開全螢幕', '退出全屏', '全画面終了', '전체화면 종료', 'quitter plein écran', 'salir pantalla completa', 'vollbild verlassen', 'sair tela cheia', 'esci schermo intero', 'выйти из полного экрана', 'फुल स्क्रीन बंद', 'الخروج من ملء الشاشة'],
      Cmd.speed05: ['0.5x', '0.5 倍', '半速', '반속', 'demi vitesse', 'media velocidad', 'halbe geschwindigkeit', 'meia velocidade', 'mezza velocità', '0.5 скорость', 'आधा', '٠٫٥'],
      Cmd.speed10: ['1x', '正常速度', '正常', '通常', '보통 속도', 'vitesse normale', 'velocidad normal', 'normale geschwindigkeit', 'velocidade normal', 'velocità normale', 'обычная скорость', 'सामान्य', 'عادي'],
      Cmd.speed125: ['1.25x', '1.25 倍', '1.25', '1.25 배', '1,25', '١٫٢٥'],
      Cmd.speed15: ['1.5x', '1.5 倍', '1.5', '1.5 배', '1,5', '١٫٥'],
      Cmd.speed20: ['2x', '2.0x', '2 倍', '2 倍速', '2 배', 'deux fois', 'doble', 'doppelt', 'duas vezes', 'doppia', 'в два раза', 'दो गुना', '٢×'],
    };
    for (final entry in lex.entries) {
      for (final phrase in entry.value) {
        if (t.contains(phrase)) return entry.key;
      }
    }
    return null;
  }
}
