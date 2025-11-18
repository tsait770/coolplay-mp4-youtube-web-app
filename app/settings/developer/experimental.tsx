import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { Zap, AlertTriangle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";

type ExperimentalFeature = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  warning?: string;
};

export default function ExperimentalFeaturesScreen() {
  const { t } = useTranslation();
  const [features, setFeatures] = useState<ExperimentalFeature[]>([
    {
      id: "ai_categorization",
      label: t("ai_auto_categorization"),
      description: t("ai_auto_categorization_desc"),
      enabled: false,
      warning: t("ai_feature_warning"),
    },
    {
      id: "advanced_voice",
      label: t("advanced_voice_recognition"),
      description: t("advanced_voice_recognition_desc"),
      enabled: false,
    },
    {
      id: "beta_player",
      label: t("beta_video_player"),
      description: t("beta_video_player_desc"),
      enabled: false,
      warning: t("beta_feature_warning"),
    },
    {
      id: "offline_mode",
      label: t("offline_mode"),
      description: t("offline_mode_desc"),
      enabled: false,
    },
    {
      id: "gesture_controls",
      label: t("gesture_controls"),
      description: t("gesture_controls_desc"),
      enabled: false,
    },
  ]);

  const toggleFeature = (id: string) => {
    const feature = features.find((f) => f.id === id);
    if (feature?.warning && !feature.enabled) {
      Alert.alert(
        t("warning"),
        feature.warning,
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("enable"),
            onPress: () => updateFeature(id),
          },
        ]
      );
    } else {
      updateFeature(id);
    }
  };

  const updateFeature = (id: string) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.warningBanner}>
          <AlertTriangle size={20} color="#FFA500" />
          <Text style={styles.warningText}>
            {t("experimental_features_warning")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("available_experimental_features")}
          </Text>
          {features.map((feature) => (
            <View key={feature.id} style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <View style={styles.featureLeft}>
                  <Zap size={20} color={Colors.primary.accent} />
                  <View style={styles.featureText}>
                    <Text style={styles.featureLabel}>{feature.label}</Text>
                    <Text style={styles.featureDescription}>
                      {feature.description}
                    </Text>
                    {feature.warning && (
                      <View style={styles.warningContainer}>
                        <AlertTriangle size={14} color="#FFA500" />
                        <Text style={styles.featureWarning}>
                          {feature.warning}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Switch
                  value={feature.enabled}
                  onValueChange={() => toggleFeature(feature.id)}
                  trackColor={{
                    false: Colors.primary.textSecondary,
                    true: Colors.primary.accent,
                  }}
                  thumbColor={Colors.secondary.bg}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t("about_experimental_features")}</Text>
          <Text style={styles.infoText}>
            {t("experimental_features_info")}
          </Text>
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
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFA50020",
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFA50040",
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#FFA500",
    lineHeight: 18,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  featureCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  featureLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  featureText: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  featureWarning: {
    fontSize: 12,
    color: "#FFA500",
    flex: 1,
  },
  infoSection: {
    padding: 16,
    paddingTop: 0,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
});
