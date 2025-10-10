import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuoteToTasks() {
  console.log('🔍 Testing quote to project tasks conversion...');
  
  try {
    // 1. Find a project with a quote_id
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, quote_id, status')
      .not('quote_id', 'is', null)
      .limit(5);
    
    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError);
      return;
    }
    
    console.log(`📋 Found ${projects.length} projects with quotes`);
    
    for (const project of projects) {
      console.log(`\n🔍 Testing project: ${project.name} (ID: ${project.id})`);
      console.log(`   Quote ID: ${project.quote_id}`);
      console.log(`   Status: ${project.status}`);
      
      // 2. Get the quote data
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('id, quote_number, items, blocks, status')
        .eq('id', project.quote_id)
        .single();
      
      if (quoteError) {
        console.error(`   ❌ Error fetching quote:`, quoteError);
        continue;
      }
      
      console.log(`   📄 Quote: ${quote.quote_number} (Status: ${quote.status})`);
      console.log(`   📦 Has items: ${!!quote.items}`);
      console.log(`   📦 Has blocks: ${!!quote.blocks}`);
      
      if (quote.items) {
        const items = typeof quote.items === 'string' ? JSON.parse(quote.items) : quote.items;
        console.log(`   📋 Items count: ${Array.isArray(items) ? items.length : 'Not an array'}`);
      }
      
      if (quote.blocks) {
        const blocks = typeof quote.blocks === 'string' ? JSON.parse(quote.blocks) : quote.blocks;
        console.log(`   📋 Blocks count: ${Array.isArray(blocks) ? blocks.length : 'Not an array'}`);
      }
      
      // 3. Get existing project tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('project_tasks')
        .select('id, task_description, block_title, is_completed, order_index, source_quote_item_id')
        .eq('project_id', project.id)
        .order('order_index');
      
      if (tasksError) {
        console.error(`   ❌ Error fetching tasks:`, tasksError);
        continue;
      }
      
      console.log(`   ✅ Project tasks count: ${tasks.length}`);
      
      if (tasks.length > 0) {
        console.log(`   📝 Tasks:`);
        tasks.forEach((task, index) => {
          console.log(`      ${index + 1}. ${task.task_description} (Block: ${task.block_title})`);
          console.log(`         Completed: ${task.is_completed}, Order: ${task.order_index}`);
          if (task.source_quote_item_id) {
            console.log(`         Source: ${task.source_quote_item_id}`);
          }
        });
      } else {
        console.log(`   ⚠️  No tasks found - trigger may not have fired`);
        
        // Try to manually trigger the function
        console.log(`   🔄 Attempting manual trigger...`);
        const { error: triggerError } = await supabase.rpc('generate_project_tasks_from_quote', {
          p_project_id: project.id
        });
        
        if (triggerError) {
          console.error(`   ❌ Manual trigger failed:`, triggerError);
        } else {
          console.log(`   ✅ Manual trigger completed`);
          
          // Check tasks again
          const { data: newTasks, error: newTasksError } = await supabase
            .from('project_tasks')
            .select('id, task_description, block_title, is_completed, order_index')
            .eq('project_id', project.id)
            .order('order_index');
          
          if (newTasksError) {
            console.error(`   ❌ Error fetching new tasks:`, newTasksError);
          } else {
            console.log(`   ✅ New tasks count: ${newTasks.length}`);
            if (newTasks.length > 0) {
              console.log(`   📝 New tasks:`);
              newTasks.forEach((task, index) => {
                console.log(`      ${index + 1}. ${task.task_description} (Block: ${task.block_title})`);
              });
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testQuoteToTasks().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
