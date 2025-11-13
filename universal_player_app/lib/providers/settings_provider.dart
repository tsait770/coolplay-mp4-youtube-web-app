import 'package:flutter/foundation.dart';

class SettingsProvider extends ChangeNotifier {
  List<String> _twitchParents = <String>['example.com'];
  List<String> get twitchParents => _twitchParents;
  void setTwitchParents(List<String> parents) {
    _twitchParents = parents;
    notifyListeners();
  }
}
