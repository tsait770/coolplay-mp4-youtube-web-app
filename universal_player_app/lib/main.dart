import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:universal_player/universal_player.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'services/speech_service.dart';
import 'services/command_mapper.dart';
import 'services/quota_service.dart';
import 'screens/settings_screen.dart';
import 'providers/settings_provider.dart';
import 'services/source_parser_service.dart';
import 'test_urls.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final supabaseUrl = const String.fromEnvironment('SUPABASE_URL');
  final supabaseAnon = const String.fromEnvironment('SUPABASE_ANON_KEY');
  final stripePk = const String.fromEnvironment('STRIPE_PUBLISHABLE_KEY');
  if (supabaseUrl.isNotEmpty && supabaseAnon.isNotEmpty) {
    await Supabase.initialize(url: supabaseUrl, anonKey: supabaseAnon);
  }
  if (stripePk.isNotEmpty) {
    Stripe.publishableKey = stripePk;
    await Stripe.instance.applySettings();
  }
  runApp(const AppRoot());
}

class AppRoot extends StatelessWidget {
  const AppRoot({super.key});
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider(create: (_) => UniversalPlayerController(backend: MethodChannelBackend())),
        Provider(create: (_) => SpeechService()),
        Provider(create: (_) => CommandMapper()),
        Provider(create: (_) => QuotaService()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
      ],
      child: MaterialApp(
        home: const LoginScreen(),
      ),
    );
  }
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PlayerScreen()));
              },
              child: const Text('Continue (mock login)'),
            ),
            const SizedBox(height: 12),
            // Batch test list
            for (final item in TestUrls.sources)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: ElevatedButton(
                  onPressed: () async {
                    final parents = context.read<SettingsProvider>().twitchParents;
                    final parser = SourceParserService(twitchParents: parents);
                    final parsed = await parser.parse(item['url']!);
                    await controller.setSource(parsed.source);
                  },
                  child: Text('Load ${item['label']}'),
                ),
              ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen()));
              },
              child: const Text('Settings'),
            ),
          ],
        ),
      ),
    );
  }
}

class PlayerScreen extends StatefulWidget {
  const PlayerScreen({super.key});
  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  late final UniversalPlayerController controller;
  late final SpeechService speech;
  late final CommandMapper mapper;
  late final QuotaService quota;
  @override
  void initState() {
    super.initState();
    controller = context.read<UniversalPlayerController>();
    speech = context.read<SpeechService>();
    mapper = context.read<CommandMapper>();
    quota = context.read<QuotaService>();
    // Auto-load default URL
    Future.microtask(() async {
      const defaultUrl = 'https://youtu.be/WBzofAAt32U?si=AvC_bhmhFPA1J9l5';
      final parents = context.read<SettingsProvider>().twitchParents;
      final parser = SourceParserService(twitchParents: parents);
      final parsed = await parser.parse(defaultUrl);
      await controller.setSource(parsed.source);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Player'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () async {
              final parents = await Navigator.of(context).push<List<String>>(MaterialPageRoute(builder: (_) => const SettingsScreen()));
              if (parents != null) {
                // In real app, persist and re-create parser/resolvers with parents.
              }
            },
          )
        ],
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            VideoControls(controller: controller),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () async {
                final src = MediaSource(
                  id: 'sample',
                  title: 'Sample',
                  isLive: false,
                  url: Uri.parse('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
                );
                await controller.setSource(src);
              },
              child: const Text('Load Sample'),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () async {
                final parents = context.read<SettingsProvider>().twitchParents;
                final parser = SourceParserService(twitchParents: parents);
                final parsed = await parser.parse('https://www.twitch.tv/videos/123456789');
                await controller.setSource(parsed.source);
              },
              child: const Text('Load Twitch (demo)'),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () async {
                await speech.requestPermissions();
                speech.start().listen((res) async {
                  final cmd = mapper.map(res.text);
                  if (cmd == null) return;
                  switch (cmd) {
                    case Cmd.play: await controller.play(); break;
                    case Cmd.pause: await controller.pause(); break;
                    case Cmd.stop: await controller.stop(); break;
                    case Cmd.replay: await controller.seek(Duration.zero); await controller.play(); break;
                    case Cmd.fwd10: await controller.seek(controller.state.position + const Duration(seconds: 10)); break;
                    case Cmd.fwd20: await controller.seek(controller.state.position + const Duration(seconds: 20)); break;
                    case Cmd.fwd30: await controller.seek(controller.state.position + const Duration(seconds: 30)); break;
                    case Cmd.back10: await controller.seek(controller.state.position - const Duration(seconds: 10)); break;
                    case Cmd.back20: await controller.seek(controller.state.position - const Duration(seconds: 20)); break;
                    case Cmd.back30: await controller.seek(controller.state.position - const Duration(seconds: 30)); break;
                    case Cmd.volMax: await controller.setVolume(1.0); break;
                    case Cmd.mute: await controller.setVolume(0.0); break;
                    case Cmd.unmute: await controller.setVolume(0.7); break;
                    case Cmd.volUp: await controller.setVolume((controller.state.volume + 0.1).clamp(0.0, 1.0)); break;
                    case Cmd.volDown: await controller.setVolume((controller.state.volume - 0.1).clamp(0.0, 1.0)); break;
                    case Cmd.enterFullscreen: break; // UI concern
                    case Cmd.exitFullscreen: break; // UI concern
                    case Cmd.speed05: break; // depends on backend support
                    case Cmd.speed10: break;
                    case Cmd.speed125: break;
                    case Cmd.speed15: break;
                    case Cmd.speed20: break;
                    case Cmd.next: break; // playlist concern
                    case Cmd.previous: break;
                  }
                  await quota.logCommand(commandType: cmd.name, extra: {'transcript': res.text});
                });
              },
              child: const Text('Start Voice Control'),
            ),
          ],
        ),
      ),
    );
  }
}
