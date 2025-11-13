import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _twitchParentCtrl = TextEditingController(text: 'example.com');

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    if (_twitchParentCtrl.text == 'example.com' && settings.twitchParents.isNotEmpty) {
      _twitchParentCtrl.text = settings.twitchParents.join(',');
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Twitch Parent Domains (comma separated)'),
            TextField(controller: _twitchParentCtrl),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                final parents = _twitchParentCtrl.text.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
                context.read<SettingsProvider>().setTwitchParents(parents);
                Navigator.of(context).pop(parents);
              },
              child: const Text('Save'),
            )
          ],
        ),
      ),
    );
  }
}
