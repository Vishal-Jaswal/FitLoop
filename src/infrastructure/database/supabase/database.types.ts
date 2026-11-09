export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      exercise_catalog: {
        Row: { id: string; slug: string; name: string; instructions: string; primary_muscle_group: string; secondary_muscles: string[]; equipment: string; created_at: string };
        Insert: { id?: string; slug: string; name: string; instructions: string; primary_muscle_group: string; secondary_muscles?: string[]; equipment: string; created_at?: string };
        Update: { id?: string; slug?: string; name?: string; instructions?: string; primary_muscle_group?: string; secondary_muscles?: string[]; equipment?: string; created_at?: string };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_routines: {
        Row: { id: string; owner_id: string; name: string; description: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; owner_id: string; name: string; description?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; owner_id?: string; name?: string; description?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      routine_exercises: {
        Row: { id: string; routine_id: string; exercise_id: string; position: number; target_sets: number; target_reps_min: number; target_reps_max: number | null; rest_seconds: number | null; created_at: string };
        Insert: { id?: string; routine_id: string; exercise_id: string; position: number; target_sets?: number; target_reps_min?: number; target_reps_max?: number | null; rest_seconds?: number | null; created_at?: string };
        Update: { id?: string; routine_id?: string; exercise_id?: string; position?: number; target_sets?: number; target_reps_min?: number; target_reps_max?: number | null; rest_seconds?: number | null; created_at?: string };
        Relationships: [];
      };
      workout_sessions: {
        Row: { id: string; owner_id: string; source_routine_id: string | null; status: "in_progress" | "completed" | "cancelled"; weight_unit: "kg" | "lb"; started_at: string; finished_at: string | null; notes: string | null };
        Insert: { id?: string; owner_id: string; source_routine_id?: string | null; status?: "in_progress" | "completed" | "cancelled"; weight_unit?: "kg" | "lb"; started_at?: string; finished_at?: string | null; notes?: string | null };
        Update: { id?: string; owner_id?: string; source_routine_id?: string | null; status?: "in_progress" | "completed" | "cancelled"; weight_unit?: "kg" | "lb"; started_at?: string; finished_at?: string | null; notes?: string | null };
        Relationships: [];
      };
      workout_session_exercises: {
        Row: { id: string; session_id: string; exercise_id: string; exercise_name_snapshot: string; primary_muscle_group_snapshot: string; position: number; created_at: string };
        Insert: { id?: string; session_id: string; exercise_id: string; exercise_name_snapshot: string; primary_muscle_group_snapshot: string; position: number; created_at?: string };
        Update: { id?: string; session_id?: string; exercise_id?: string; exercise_name_snapshot?: string; primary_muscle_group_snapshot?: string; position?: number; created_at?: string };
        Relationships: [];
      };
      workout_sets: {
        Row: { id: string; session_exercise_id: string; position: number; set_type: "warmup" | "working"; reps: number | null; weight_kg: number | null; completed_at: string | null; created_at: string };
        Insert: { id?: string; session_exercise_id: string; position: number; set_type?: "warmup" | "working"; reps?: number | null; weight_kg?: number | null; completed_at?: string | null; created_at?: string };
        Update: { id?: string; session_exercise_id?: string; position?: number; set_type?: "warmup" | "working"; reps?: number | null; weight_kg?: number | null; completed_at?: string | null; created_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      start_workout_from_routine: { Args: { p_routine_id: string; p_weight_unit?: string }; Returns: string };
      reorder_routine_exercises: { Args: { p_routine_id: string; p_exercise_ids: string[] }; Returns: undefined };
      finish_workout: { Args: { p_session_id: string }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type DbExercise = Database["public"]["Tables"]["exercise_catalog"]["Row"];
export type DbRoutine = Database["public"]["Tables"]["workout_routines"]["Row"];
export type DbRoutineExercise = Database["public"]["Tables"]["routine_exercises"]["Row"];
export type DbWorkoutSession = Database["public"]["Tables"]["workout_sessions"]["Row"];
export type DbSessionExercise = Database["public"]["Tables"]["workout_session_exercises"]["Row"];
export type DbWorkoutSet = Database["public"]["Tables"]["workout_sets"]["Row"];
