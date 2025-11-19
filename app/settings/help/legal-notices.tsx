import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";
import { Stack } from "expo-router";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";

interface LicenseItem {
  name: string;
  version: string;
  license: string;
  url?: string;
}

interface ThirdPartyService {
  name: string;
  purpose: string;
  privacyUrl: string;
  termsUrl?: string;
}

export default function LegalNoticesScreen() {
  const { t } = useTranslation();
  const [expandedLicenses, setExpandedLicenses] = useState<boolean>(false);
  const [expandedServices, setExpandedServices] = useState<boolean>(false);

  const openSourceLicenses: LicenseItem[] = [
    { name: "React Native", version: "0.76.x", license: "MIT License", url: "https://github.com/facebook/react-native" },
    { name: "Expo", version: "54.x", license: "MIT License", url: "https://github.com/expo/expo" },
    { name: "React", version: "18.x", license: "MIT License", url: "https://github.com/facebook/react" },
    { name: "TypeScript", version: "5.x", license: "Apache-2.0", url: "https://github.com/microsoft/TypeScript" },
    { name: "Supabase", version: "2.x", license: "Apache-2.0", url: "https://github.com/supabase/supabase" },
    { name: "TanStack Query", version: "5.x", license: "MIT License", url: "https://github.com/TanStack/query" },
    { name: "tRPC", version: "11.x", license: "MIT License", url: "https://github.com/trpc/trpc" },
    { name: "Hono", version: "4.x", license: "MIT License", url: "https://github.com/honojs/hono" },
    { name: "Lucide React Native", version: "0.x", license: "ISC License", url: "https://github.com/lucide-icons/lucide" },
    { name: "React Native Gesture Handler", version: "2.x", license: "MIT License", url: "https://github.com/software-mansion/react-native-gesture-handler" },
    { name: "React Native Safe Area Context", version: "4.x", license: "MIT License", url: "https://github.com/th3rdwave/react-native-safe-area-context" },
    { name: "AsyncStorage", version: "1.x", license: "MIT License", url: "https://github.com/react-native-async-storage/async-storage" },
  ];

  const thirdPartyServices: ThirdPartyService[] = [
    {
      name: "YouTube",
      purpose: t("youtube_service_purpose"),
      privacyUrl: "https://policies.google.com/privacy",
      termsUrl: "https://www.youtube.com/t/terms",
    },
    {
      name: "Vimeo",
      purpose: t("vimeo_service_purpose"),
      privacyUrl: "https://vimeo.com/privacy",
      termsUrl: "https://vimeo.com/terms",
    },
    {
      name: "Twitch",
      purpose: t("twitch_service_purpose"),
      privacyUrl: "https://www.twitch.tv/p/legal/privacy-policy/",
      termsUrl: "https://www.twitch.tv/p/legal/terms-of-service/",
    },
    {
      name: "Supabase",
      purpose: t("supabase_service_purpose"),
      privacyUrl: "https://supabase.com/privacy",
      termsUrl: "https://supabase.com/terms",
    },
    {
      name: "Stripe",
      purpose: t("stripe_service_purpose"),
      privacyUrl: "https://stripe.com/privacy",
      termsUrl: "https://stripe.com/legal",
    },
    {
      name: "PayPal",
      purpose: t("paypal_service_purpose"),
      privacyUrl: "https://www.paypal.com/privacy",
      termsUrl: "https://www.paypal.com/legalhub/home",
    },
  ];

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t("legal_notices"),
          headerStyle: { backgroundColor: Colors.primary.bg },
          headerTintColor: Colors.primary.text,
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.intro}>
            {t("legal_notices_intro")}
          </Text>

          <View style={styles.section}>
            <Pressable
              style={styles.sectionHeader}
              onPress={() => setExpandedLicenses(!expandedLicenses)}
            >
              <Text style={styles.sectionTitle}>{t("open_source_licenses")}</Text>
              {expandedLicenses ? (
                <ChevronDown size={20} color={Colors.primary.text} />
              ) : (
                <ChevronRight size={20} color={Colors.primary.text} />
              )}
            </Pressable>

            {expandedLicenses && (
              <View style={styles.sectionContent}>
                <Text style={styles.sectionDescription}>
                  {t("oss_licenses_desc")}
                </Text>
                {openSourceLicenses.map((item, index) => (
                  <View key={index} style={styles.licenseItem}>
                    <View style={styles.licenseHeader}>
                      <Text style={styles.licenseName}>{item.name}</Text>
                      <View style={styles.licenseBadge}>
                        <Text style={styles.licenseBadgeText}>{item.license}</Text>
                      </View>
                    </View>
                    <Text style={styles.licenseVersion}>
                      {t("version")}: {item.version}
                    </Text>
                    {item.url && (
                      <Pressable
                        style={styles.licenseLink}
                        onPress={() => openLink(item.url!)}
                      >
                        <Text style={styles.licenseLinkText}>{t("view_repository")}</Text>
                        <ExternalLink size={14} color={Colors.primary.accent} />
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Pressable
              style={styles.sectionHeader}
              onPress={() => setExpandedServices(!expandedServices)}
            >
              <Text style={styles.sectionTitle}>{t("third_party_services")}</Text>
              {expandedServices ? (
                <ChevronDown size={20} color={Colors.primary.text} />
              ) : (
                <ChevronRight size={20} color={Colors.primary.text} />
              )}
            </Pressable>

            {expandedServices && (
              <View style={styles.sectionContent}>
                <Text style={styles.sectionDescription}>
                  {t("third_party_services_desc")}
                </Text>
                {thirdPartyServices.map((service, index) => (
                  <View key={index} style={styles.serviceCard}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.servicePurpose}>{service.purpose}</Text>
                    <View style={styles.serviceLinks}>
                      <Pressable
                        style={styles.serviceLink}
                        onPress={() => openLink(service.privacyUrl)}
                      >
                        <Text style={styles.serviceLinkText}>{t("privacy_policy")}</Text>
                        <ExternalLink size={14} color={Colors.primary.accent} />
                      </Pressable>
                      {service.termsUrl && (
                        <Pressable
                          style={styles.serviceLink}
                          onPress={() => openLink(service.termsUrl!)}
                        >
                          <Text style={styles.serviceLinkText}>{t("terms_of_service")}</Text>
                          <ExternalLink size={14} color={Colors.primary.accent} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t("last_updated")}: 2025-11-20
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  intro: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.secondary.bg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.primary.text,
  },
  sectionContent: {
    marginTop: 12,
    paddingLeft: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  licenseItem: {
    backgroundColor: Colors.secondary.bg,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  licenseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  licenseName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary.text,
    flex: 1,
  },
  licenseBadge: {
    backgroundColor: `${Colors.primary.accent}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  licenseBadgeText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.primary.accent,
  },
  licenseVersion: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginBottom: 6,
  },
  licenseLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  licenseLinkText: {
    fontSize: 12,
    color: Colors.primary.accent,
    fontWeight: "500" as const,
  },
  serviceCard: {
    backgroundColor: Colors.secondary.bg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  servicePurpose: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceLinks: {
    gap: 8,
  },
  serviceLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  serviceLinkText: {
    fontSize: 13,
    color: Colors.primary.accent,
    fontWeight: "500" as const,
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.card.border,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    fontStyle: "italic" as const,
  },
});
