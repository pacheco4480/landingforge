import { baseSectionRegistry } from "@/features/public-renderer/section-registry/base";
import type { PublicSectionProps } from "@/features/public-renderer/types";
import {
  ClinicBookingSection,
  ClinicCredentialsSection,
  ClinicDoctorsSection,
  ClinicFacilitiesSection,
  ClinicHeroSection,
  ClinicLocationsSection,
  ClinicPatientJourneySection,
  ClinicPrivateExperienceSection,
  ClinicSpecialtiesSection,
} from "@/features/public-renderer/templates/clinic";

export const clinicSectionRegistry: Record<string, React.ComponentType<PublicSectionProps>> = {
  ...baseSectionRegistry,
  clinic_hero: ClinicHeroSection,
  clinic_specialties: ClinicSpecialtiesSection,
  clinic_doctors: ClinicDoctorsSection,
  clinic_credentials: ClinicCredentialsSection,
  clinic_patient_journey: ClinicPatientJourneySection,
  clinic_facilities: ClinicFacilitiesSection,
  clinic_locations: ClinicLocationsSection,
  clinic_booking: ClinicBookingSection,
  clinic_private_experience: ClinicPrivateExperienceSection,
};
