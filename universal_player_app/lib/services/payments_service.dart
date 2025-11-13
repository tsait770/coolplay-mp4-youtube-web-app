import 'package:flutter_stripe/flutter_stripe.dart';

class PaymentsService {
  Future<void> init(String publishableKey) async {
    Stripe.publishableKey = publishableKey;
    await Stripe.instance.applySettings();
  }

  Future<void> presentPaymentSheet({required String clientSecret}) async {
    await Stripe.instance.initPaymentSheet(paymentSheetParameters: SetupPaymentSheetParameters(
      merchantDisplayName: 'Universal Player',
      paymentIntentClientSecret: clientSecret,
    ));
    await Stripe.instance.presentPaymentSheet();
  }
}
