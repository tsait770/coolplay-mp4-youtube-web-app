import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MessageSquare, Zap, Settings2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";

export default function CommandsScreen() {
  const { t } = useTranslation();

  const features = [
    {
      icon: MessageSquare,
      title: "Custom Phrases",
      description: "Create personalized voice commands",
    },
    {
      icon: Zap,
      title: "Quick Actions",
      description: "Set up shortcuts for common tasks",
    },
    {
      icon: Settings2,
      title: "Advanced Settings",
      description: "Fine-tune command recognition",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <MessageSquare size={56} color={Colors.primary.accent} strokeWidth={2} />
          <Text style={styles.title}>{t("custom_commands")}</Text>
          <Text style={styles.subtitle}>
            Custom voice commands feature is coming soon
          </Text>
        </View>

        <View style={styles.featuresSection}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Icon size={24} color={Colors.primary.accent} strokeWidth={2} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            );
          })}
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
  scrollContent: {
    padding: 20,
  },
  headerSection: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.primary.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  featuresSection: {
    marginTop: 24,
  },
  featureCard: {
    flexDirection: "row",
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.primary.accent + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
});
