-- Добавление политик DELETE для projects и tasks
-- Эти политики позволяют аутентифицированным пользователям удалять проекты и задачи

DO $$ BEGIN
  -- DELETE policy для projects
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='projects' AND policyname='delete projects') THEN
    CREATE POLICY "delete projects" ON public.projects FOR DELETE TO authenticated USING (true);
  END IF;
  
  -- DELETE policy для tasks (если ещё нет)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='delete tasks') THEN
    CREATE POLICY "delete tasks" ON public.tasks FOR DELETE TO authenticated USING (true);
  END IF;
  
  -- DELETE policy для task_checklists
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_checklists' AND policyname='delete checklists') THEN
    CREATE POLICY "delete checklists" ON public.task_checklists FOR DELETE TO authenticated USING (true);
  END IF;
  
  -- DELETE policy для task_checklist_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_checklist_items' AND policyname='delete checklist items') THEN
    CREATE POLICY "delete checklist items" ON public.task_checklist_items FOR DELETE TO authenticated USING (true);
  END IF;
  
  -- DELETE policy для task_attachments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_attachments' AND policyname='delete attachments') THEN
    CREATE POLICY "delete attachments" ON public.task_attachments FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

