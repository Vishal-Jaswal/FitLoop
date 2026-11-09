"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EQUIPMENT, MUSCLE_GROUPS } from "./catalog";
import type { Exercise } from "./types";
import { PageHeading, Tag } from "./workout-ui";

export function ExerciseLibrary({ exercises }: { exercises: Exercise[] }) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("all");
  const [equipment, setEquipment] = useState("all");
  const filtered = useMemo(() => exercises.filter((exercise) => {
    const matchesName = exercise.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesMuscle = muscle === "all" || exercise.primaryMuscleGroup === muscle;
    const matchesEquipment = equipment === "all" || exercise.equipment === equipment;
    return matchesName && matchesMuscle && matchesEquipment;
  }), [equipment, exercises, muscle, query]);

  return (
    <Container className="py-8 sm:py-11 lg:py-14">
      <PageHeading eyebrow="Move with intention" title="Exercise library" description="Find an exercise, review the setup, and add it to a routine or workout." action={<Tag tone="accent">{exercises.length} movements</Tag>} />
      <section aria-label="Exercise filters" className="mb-6 grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted" htmlFor="exercise-search">Search by name</label>
          <input id="exercise-search" className="min-h-12 rounded-control border border-border bg-surface px-4 text-[16px] text-foreground outline-none focus:border-accent/70" onChange={(event) => setQuery(event.target.value)} placeholder="Try bench press" type="search" value={query} />
        </div>
        <FilterSelect id="muscle-filter" label="Muscle group" value={muscle} onChange={setMuscle} options={MUSCLE_GROUPS} />
        <FilterSelect id="equipment-filter" label="Equipment" value={equipment} onChange={setEquipment} options={EQUIPMENT} />
      </section>
      <div className="mb-4 flex items-center justify-between text-xs text-muted"><span>{filtered.length} results</span><button className="min-h-10 rounded-pill px-3 text-accent-bright underline underline-offset-4" onClick={() => { setQuery(""); setMuscle("all"); setEquipment("all"); }} type="button">Clear filters</button></div>
      {filtered.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((exercise, index) => (
            <li key={exercise.id}>
              <Card className="h-full p-5 transition hover:border-accent/35">
                <Link aria-label={`View ${exercise.name}`} className="flex h-full flex-col" href={`/exercises/${exercise.slug}`}>
                  <div className="mb-5 flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-sm font-semibold text-accent-bright">{String(index + 1).padStart(2, "0")}</span><Tag>{exercise.equipment}</Tag></div>
                  <h2 className="text-lg font-semibold tracking-tight">{exercise.name}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{exercise.instructions}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-5"><Tag tone="accent">{exercise.primaryMuscleGroup}</Tag>{exercise.secondaryMuscles.slice(0, 2).map((item) => <Tag key={item}>{item}</Tag>)}</div>
                  <span className="sr-only">View exercise instructions and performance</span>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="px-5 py-12 text-center"><p className="text-lg font-semibold">No exercises match those filters</p><p className="mt-2 text-sm text-muted">Try another movement, muscle group, or equipment type.</p><Button className="mt-5" onClick={() => { setQuery(""); setMuscle("all"); setEquipment("all"); }} variant="secondary">Show all exercises</Button></Card>
      )}
    </Container>
  );
}

function FilterSelect({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (value: string) => void; options: readonly string[] }) {
  return <div className="grid gap-2"><label className="text-xs font-medium text-muted" htmlFor={id}>{label}</label><select className="min-h-12 rounded-control border border-border bg-surface px-4 text-[16px] capitalize text-foreground outline-none focus:border-accent/70" id={id} onChange={(event) => onChange(event.target.value)} value={value}><option value="all">All {label.toLowerCase()}s</option>{options.map((option) => <option className="capitalize" key={option} value={option}>{option}</option>)}</select></div>;
}
